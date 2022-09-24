import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  Ref,
  shallowRef,
  ShallowRef,
  unref,
  VNode,
  watchEffect,
} from "vue";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import {
  CellEditorProps,
  CellInterface,
  CellPosition,
  ScrollCoords,
  SelectionArea,
} from "$vct/types";
import {
  clampIndex,
  isEqualCells,
  findNextCellWithinBounds,
  isArrowKey,
  flatSelectionsToCellInterfaceArr,
} from "$vct/helpers";
import { useStore } from "$vct/hooks/useStore";
import CellEditor from "../components/CellEditor.vue";
import { Direction, KeyCodes } from "$vct/enums";
import { useGlobalStore } from "$vct/store/global";
import { useSensitiveOperation } from "$vct/hooks/useSensitiveOperation";

type Props = {
  wrap: Ref<HTMLDivElement | undefined>;
};

type ReturnType = {
  EditorVNode: ShallowRef<VNode | undefined>;
};

export function useEditable(props: Props): ReturnType {
  //  参数
  const canEdit = (cell: CellInterface) => true;
  const sticky = true;
  const hideOnBlur = true;

  const globalStore = useGlobalStore();
  const {
    getCellCoordsFromOffset,
    getScrollPosition,
    scrollToItem,
    getCellOffsetFromCoords,
    getDimensions,
    getCellBounds,
    getCellValueByCoord,
    getRowOffset,
    getColumnOffset,
    setCellValueByCoord,
    isReadonlyCell,
    isHiddenColumn,
    isHiddenRow,
    isMouseInCells,
    getColumnByColIndex,
    getRowByIndex,
    deleteCellValue,
    deleteCellsBySelection,
  } = useExpose();
  const { frozenRows, frozenColumns, columnCount, rowCount, scrollState } =
    useStore();
  const { showConfirm } = useSensitiveOperation();

  const activeCell = computed(() => globalStore.activeCell);
  const selections = computed(() => globalStore.selections);
  const initialActiveCell = ref<CellInterface | null>();
  const isEditorShown = ref<boolean>(false);
  const valueRef = ref<string>("");
  const autoFocusRef = ref<boolean>(true);
  const scrollPositionRef = ref<ScrollCoords>({ scrollLeft: 0, scrollTop: 0 });
  const positionRef = ref<CellPosition>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const maxEditorDimensionsRef = ref<{ height: number; width: number }>();
  const currentActiveCellRef = ref<CellInterface | null>(null);
  const isDirtyRef = ref<boolean>(false);
  const initialValueRef = ref<string>();
  const currentValueRef = ref<string>(valueRef.value);
  const isFrozenRow = computed(() => {
    if (!currentActiveCellRef.value) return false;
    return currentActiveCellRef.value.rowIndex < unref(frozenRows);
  });
  const isFrozenColumn = computed(() => {
    if (!currentActiveCellRef.value) return false;
    return currentActiveCellRef.value.columnIndex < unref(frozenColumns);
  });
  const finalCellPosition = computed(() => {
    /**
     * Since the editor is sticky,
     * we dont need to adjust the position,
     * as scrollposition wont move the editor
     *
     * When the editor is first active, in makeEditable,
     * we accomodate for the initial scrollPosition
     */
    if (sticky) {
      return positionRef.value;
    }
    /**
     * If editor is not sticky, keep adjusting
     * its position to accomodate for scroll
     */
    return getCellPosition(positionRef.value, scrollPositionRef.value);
  });
  const EditorVNode = shallowRef<VNode>(<div></div>);

  watchEffect(() => {
    /* Get offset of frozen rows and columns */
    const frozenRowOffset = getRowOffset(frozenRows.value);
    const frozenColumnOffset = getColumnOffset(frozenColumns.value);

    const renderProps: CellEditorProps = {
      column: currentActiveCellRef.value
        ? getColumnByColIndex(currentActiveCellRef.value.columnIndex)
        : null,
      row: currentActiveCellRef.value
        ? getRowByIndex(currentActiveCellRef.value.rowIndex)
        : null,
      cell: currentActiveCellRef.value as CellInterface,
      activeCell: activeCell.value as CellInterface,
      autoFocus: autoFocusRef.value,
      value: valueRef.value,
      selections: selections.value,
      onChange: handleChange,
      onSubmit: handleSubmit,
      onCancel: handleCancel,
      position: finalCellPosition.value,
      width: positionRef.value.width as number,
      height: positionRef.value.height as number,
      scrollPosition: scrollPositionRef.value,
      nextFocusableCell: nextFocusableCell,
      onBlur: handleBlur,
      maxWidth: maxEditorDimensionsRef.value?.width,
      maxHeight: maxEditorDimensionsRef.value?.height,
      isFrozenRow: isFrozenRow.value,
      isFrozenColumn: isFrozenColumn.value,
      frozenRowOffset: frozenRowOffset,
      frozenColumnOffset: frozenColumnOffset,
    };

    EditorVNode.value = isEditorShown.value ? (
      <>
        <CellEditor renderProps={renderProps} />
      </>
    ) : (
      <div></div>
    );
  });

  watchEffect(() => {
    if (!currentActiveCellRef.value) return;
    scrollPositionRef.value = scrollState.value;
  });

  onMounted(() => {
    if (props.wrap.value) {
      props.wrap.value?.addEventListener("dblclick", handleDBClick);
      props.wrap.value?.addEventListener("keydown", handleKeydown);
      props.wrap.value?.addEventListener("mousedown", handleMousedown);
    }
  });

  onBeforeUnmount(() => {
    if (props.wrap.value) {
      props.wrap.value?.removeEventListener("dbclick", handleDBClick);
      props.wrap.value?.removeEventListener("keydown", handleKeydown);
      props.wrap.value?.removeEventListener("mousedown", handleMousedown);
    }
  });

  function makeEditable(
    coords: CellInterface,
    initialValue?: string,
    autoFocus: boolean = true
  ) {
    if (!props.wrap.value) return;

    /* Check if its the same cell */
    if (isEqualCells(coords, currentActiveCellRef.value)) {
      return;
    }

    /* is readonly? */
    if (isReadonlyCell(coords)) return;

    /* Call on before edit */
    if (canEdit(coords)) {
      /*  Focus */
      scrollToItem(coords);

      currentActiveCellRef.value = coords;

      /* Get offsets */
      const pos = getCellOffsetFromCoords(coords);
      const scrollPosition = getScrollPosition();
      const cellValue = getCellValueByCoord({
        rowIndex: coords.rowIndex,
        columnIndex: coords.columnIndex,
      });
      const value = initialValue || cellValue || "";
      const cellPosition = sticky
        ? // Editor is rendered outside the <Grid /> component
          // If the user has scrolled down, and then activate the editor, we will need to adjust the position
          // of the sticky editor accordingly
          // Subsequent scroll events has no effect, cos of sticky option
          getCellPosition(pos, scrollPosition)
        : pos;
      /**
       * Set max editor ref based on grid container
       */
      const { containerWidth, containerHeight } = getDimensions();
      maxEditorDimensionsRef.value = {
        height: containerHeight - (cellPosition.y ?? 0),
        width: containerWidth - (cellPosition.x ?? 0),
      };

      /**
       * If the user has entered a value in the cell, mark it as dirty
       * So that during mousedown, onSubmit gets called
       */
      isDirtyRef.value = !!initialValue;
      initialValueRef.value = initialValue;

      /* Trigger onChange handlers */
      valueRef.value = value;
      autoFocusRef.value = autoFocus;
      scrollPositionRef.value = scrollPosition;
      positionRef.value = cellPosition;
      showEditor();
    }
  }

  function handleDBClick(e: MouseEvent) {
    if (!detectIsContainerEvent(e)) return;

    if (!props.wrap.value) return;
    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);
    if (!coords) return;
    const { rowIndex, columnIndex } = coords;

    //  判断是不是 rowHeader
    if (!isMouseInCells(e.clientX, e.clientY)) return;

    makeEditable({ rowIndex, columnIndex });
  }

  function getCellPosition(
    position: CellPosition,
    scrollPosition: ScrollCoords
  ) {
    if (!currentActiveCellRef.value) return { x: 0, y: 0 };
    return {
      ...position,
      x:
        (position.x as number) -
        (isFrozenColumn.value ? 0 : scrollPosition.scrollLeft),
      y:
        (position.y as number) -
        (isFrozenRow.value ? 0 : scrollPosition.scrollTop),
    };
  }

  function showEditor() {
    isEditorShown.value = true;
  }

  function hideEditor() {
    isEditorShown.value = false;
    currentActiveCellRef.value = null;
  }

  function handleChange(newValue: string, activeCell) {
    /**
     * Make sure we dont call onChange if initialValue is set
     * This is to accomodate for editor that fire onChange during initialvalue
     * Eg: Slate  <Editor value='' onChange />
     */
    if (
      initialValueRef.value !== void 0 &&
      initialValueRef.value === newValue
    ) {
      initialValueRef.value = void 0;
      return;
    }
    if (!currentActiveCellRef.value) return;
    /* Check if the value has changed. Used to conditionally submit if editor is not in focus */
    isDirtyRef.value = newValue !== valueRef.value;
    valueRef.value = newValue;
  }

  /* Save the value */
  function handleSubmit(
    value: string,
    activeCell: CellInterface,
    nextActiveCell?: CellInterface | null
  ) {
    activeCell = activeCell ? activeCell : globalStore.activeCell;

    /**
     * Hide the editor first, so that we can handle onBlur events
     * 1. Editor hides -> Submit
     * 2. If user clicks outside the grid, onBlur is called, if there is a activeCell, we do another submit
     */
    hideEditor();

    /* Save the new value */
    setCellValueByCoord(activeCell, value);

    /* Keep the focus */
    focusGrid();
  }

  function focusGrid() {
    requestAnimationFrame(() => props.wrap.value && props.wrap.value.focus());
  }

  /* When the input is blurred out */
  function handleCancel(e?: KeyboardEvent) {
    hideEditor();
    /* Keep the focus back in the grid */
    focusGrid();
  }

  function handleBlur(e: FocusEvent) {
    if (currentActiveCellRef.value) {
      /* Keep the focus */
      focusGrid();
    }
  }

  /**
   * Get next focusable cell
   * Respects selection bounds
   */
  function nextFocusableCell(
    currentCell: CellInterface,
    direction: Direction = Direction.Right
  ): CellInterface | null {
    /* Next immediate cell */
    const bounds = getCellBounds(currentCell);
    if (!bounds) return null;
    let nextActiveCell;
    switch (direction) {
      case Direction.Right: {
        let columnIndex = clampIndex(
          Math.min(bounds.right + 1, columnCount.value - 1),
          isHiddenColumn,
          direction
        );
        nextActiveCell = {
          rowIndex: bounds.top,
          columnIndex,
        };
        break;
      }
      case Direction.Up:
        let rowIndex = clampIndex(
          Math.max(bounds.top - 1, 0),
          isHiddenRow,
          direction
        );
        nextActiveCell = {
          rowIndex,
          columnIndex: bounds.left,
        };
        break;

      case Direction.Left: {
        let columnIndex = clampIndex(
          Math.max(bounds.left - 1, 0),
          isHiddenColumn,
          direction
        );
        nextActiveCell = {
          rowIndex: bounds.top,
          columnIndex,
        };
        break;
      }

      default: {
        // Down
        let rowIndex = clampIndex(
          Math.min(
            (initialActiveCell.value?.rowIndex ?? bounds.bottom) + 1,
            rowCount.value - 1
          ),
          isHiddenRow,
          direction
        );
        nextActiveCell = {
          rowIndex,
          columnIndex: initialActiveCell.value?.columnIndex ?? bounds.left,
        };
        break;
      }
    }
    if (direction === Direction.Right && !initialActiveCell.value) {
      initialActiveCell.value = currentCell;
    }

    if (direction === Direction.Down) {
      /* Move to the next row + cell */
      initialActiveCell.value = undefined;
    }

    /* If user has selected some cells and active cell is within this selection */
    if (selections.value.length && currentCell && props.wrap.value) {
      const { bounds } = selections.value[selections.value.length - 1];
      const activeCellBounds = getCellBounds(currentCell);
      const nextCell = findNextCellWithinBounds(
        activeCellBounds,
        bounds,
        direction
      );
      if (nextCell) nextActiveCell = nextCell;
    }
    return nextActiveCell;
  }

  function isSelectionKey(keyCode: number) {
    return (
      [
        KeyCodes.Right,
        KeyCodes.Left,
        KeyCodes.Up,
        KeyCodes.Down,
        KeyCodes.Meta,
        KeyCodes.Escape,
        KeyCodes.Tab,
        KeyCodes.Home,
        KeyCodes.End,
        KeyCodes.CapsLock,
        KeyCodes.PageDown,
        KeyCodes.PageUp,
        KeyCodes.ScrollLock,
        KeyCodes.NumLock,
        KeyCodes.Insert,
        KeyCodes.Pause,
      ].includes(keyCode) ||
      // Exclude Function keys
      (keyCode >= KeyCodes.F1 && keyCode <= KeyCodes.F12)
    );
  }

  /**
   * 检测事件是否是在 container 上触发的
   * @param e
   */
  function detectIsContainerEvent(e) {
    if (e && e.target) {
      const target = e.target as HTMLDivElement;
      if (
        target.classList.contains("grid-container") ||
        target.tagName === "CANVAS"
      ) {
        return true;
      }
    }

    return false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!detectIsContainerEvent(e)) return;
    const keyCode = e.keyCode;
    if (keyCode === KeyCodes.Tab && !initialActiveCell.value) {
      initialActiveCell.value = activeCell.value;
    }
    if (isArrowKey(keyCode)) {
      initialActiveCell.value = undefined;
    }
    if (
      isSelectionKey(keyCode) ||
      e.ctrlKey ||
      (e.shiftKey && (e.key === "Shift" || e.which === KeyCodes.SPACE)) ||
      e.metaKey ||
      e.which === KeyCodes.ALT
    )
      return;
    /* If user has not made any selection yet */
    if (!activeCell.value) return;

    const { rowIndex, columnIndex } = activeCell.value;

    if (keyCode === KeyCodes.Delete || keyCode === KeyCodes.BackSpace) {
      showConfirm(
        flatSelectionsToCellInterfaceArr(selections.value).length
      ).then((res) => {
        if (res) {
          deleteCellValue(activeCell.value);
          deleteCellsBySelection();
          e.preventDefault();
        }
      });

      return;
    }

    const initialValue =
      keyCode === KeyCodes.Enter // Enter key
        ? undefined
        : e.key;

    makeEditable({ rowIndex, columnIndex }, initialValue);

    /* Prevent the first keystroke */
    e.preventDefault();
  }

  function handleMousedown(e: MouseEvent) {
    if (!detectIsContainerEvent(e)) return;

    /* Persistent input, hides only during Enter key or during submit or cancel calls */
    if (!hideOnBlur) {
      return;
    }
    if (currentActiveCellRef.value) {
      if (isDirtyRef.value) {
        handleSubmit(valueRef.value, currentActiveCellRef.value);
      } else {
        handleCancel();
      }
    }
    initialActiveCell.value = undefined;
  }

  return {
    EditorVNode,
  };
}
