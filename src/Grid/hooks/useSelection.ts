/**
 * 选区功能
 */
import {
  onBeforeUnmount,
  onMounted,
  ref,
  Ref,
  ShallowRef,
  unref,
  VNode,
} from "vue";
import { useExpose } from "@/Grid/hooks/useExpose";
import { MouseButtonCodes } from "@/enums";
import { CellInterface, SelectionArea } from "@/types";
import {
  cellIdentifier,
  cellRangeToBounds,
  getBoundedCells,
  isEqualCells,
} from "@/helpers";
import { useSelectionRender } from "@/Grid/hooks/useSelectionRender";

type Props = {
  wrap: Ref<HTMLDivElement | undefined>;
};

type ReturnType = {
  selectionChildren: ShallowRef<VNode | undefined>;
};

export function useSelection(props: Props): ReturnType {
  //  参数
  const selectionTopBound = 0;
  const selectionLeftBound = 0;
  const allowDeselectSelection = true;
  const newSelectionMode: "clear" | "modify" | "append" = "clear";
  const selectionPolicy: "single" | "range" | "multiple" = "multiple";
  //  自动滚动到选中的 cell
  const alwaysScrollToActiveCell = true;
  //  如果返回 false 则不会响应 mousemove 事件
  const mouseMoveInterceptor = (
    e: MouseEvent,
    coords: CellInterface,
    start: CellInterface | null,
    end: CellInterface | null
  ) => {
    return true;
  };
  //  如果返回 false 则不会响应 mousedown 事件
  const mouseDownInterceptor = (
    e: MouseEvent,
    coords: CellInterface,
    start: CellInterface | null,
    end: CellInterface | null
  ) => {
    return true;
  };
  //  选区是否可以合并
  const canSelectionSpanMergedCells = (
    start: CellInterface,
    end: CellInterface
  ) => {
    return true;
  };

  const { getCellCoordsFromOffset, scrollToItem, getCellBounds } = useExpose();

  const selections = ref<SelectionArea[]>([]);
  const isSelecting = ref<boolean>(false);
  const selectionStart = ref<CellInterface | null>(null);
  const selectionEnd = ref<CellInterface | null>(null);
  const firstActiveCell = ref<CellInterface | null>(null);
  const activeCell = ref<CellInterface | null>(null);
  const fillSelection = ref<SelectionArea | null>(null);

  const { selectionChildren } = useSelectionRender({
    selections,
    activeCell,
    fillSelection,
    methods:{
      selectionFromStartEnd
    }
  });

  onMounted(() => {
    if (props.wrap.value) {
      props.wrap.value?.addEventListener("mousedown", handleMouseDown);
    }
  });

  onBeforeUnmount(() => {
    if (props.wrap.value) {
      props.wrap.value?.removeEventListener("mousedown", handleMouseDown);
    }
  });

  function handleMouseDown(e: MouseEvent) {
    if (!props.wrap.value) return;
    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);

    if (!coords) {
      return;
    }

    /* Check if its context menu click */
    const isContextMenuClick = e.which === MouseButtonCodes.right;
    if (isContextMenuClick) {
      const cellIndex = cellIndexInSelection(coords, unref(selections));
      if (cellIndex !== -1) return;
    }
    const isShiftKey = e.shiftKey;
    const isMetaKey = e.ctrlKey || e.metaKey;
    const allowMultiple = isMetaKey;
    const allowDeselect = allowDeselectSelection;
    const hasSelections = unref(selections).length > 0;
    const isDeselecting = isMetaKey && allowDeselect;

    if (!isContextMenuClick && selectionPolicy !== "single") {
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mousemove", handleMouseMove);
    }

    /* Activate selection mode */
    isSelecting.value = true;

    if (
      mouseDownInterceptor?.(
        e,
        coords,
        unref(selectionStart),
        unref(selectionEnd)
      ) === false
    ) {
      return;
    }

    /* Shift key */
    if (isShiftKey) {
      modifySelection(coords);
      return;
    }

    /* Is the current cell same as active cell */
    const isSameAsActiveCell = isEqualCells(coords, unref(activeCell));

    /* Command  or Control key */
    if (unref(activeCell) && allowMultiple) {
      /**
       * User is adding activeCell to selection
       *
       * 1. User is selecting and not de-selecting
       * 2. User has not made any selection
       * 3. Trying to add active cell to selection
       */
      if (isSameAsActiveCell && (!isDeselecting || !hasSelections)) {
        return;
      }

      /**
       * User is manually trying to select multiple selections,
       * So add the current active cell to the list
       */
      if (isMetaKey && !hasSelections && activeCell.value) {
        appendSelection(activeCell.value, activeCell.value);
      }

      /**
       * Check if this cell has already been selected (only for manual deselect)
       * Remove it from selection
       *
       * Future enhancements -> Split selection, so that 1 cell can be removed from range
       */
      if (isMetaKey && allowDeselect) {
        const cellIndex = cellIndexInSelection(coords, unref(selections));
        if (cellIndex !== -1) {
          const newSelection = removeSelectionByIndex(cellIndex);
          const nextActiveCell =
            getPossibleActiveCellFromSelections(newSelection);
          if (nextActiveCell !== null) {
            activeCell.value = nextActiveCell;
          }
          if (
            newSelection.length === 1 &&
            cellEqualsSelection(nextActiveCell, newSelection)
          ) {
            /* Since we only have 1 cell, lets clear the selections and only keep activeCell */
            clearSelections();
          }
          return;
        }
      }

      /**
       * TODO
       * 1. Ability to remove selection
       * 2. Ability to remove from selection area
       * 3. Ability to switch activeCell if its part of removed selection
       */
      appendSelection(coords);
      return;
    }

    /**
     * Scroll to the selected cell
     */
    if (alwaysScrollToActiveCell) {
      scrollToItem(coords);
    }

    /**
     * If user is selecting the same same,
     * let not trigger another state change
     */
    if (isSameAsActiveCell) return;

    /* Trigger new selection */
    newSelection(coords);
  }

  function handleMouseUp() {
    /* Reset selection mode */
    isSelecting.value = false;

    /* Remove listener */
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    /* Update last selection */
    let selectionLength = unref(selections).length;
    if (!selectionLength) {
      selections.value = [];
      return;
    } else {
      selections.value = selections.value.map((sel, i) => {
        if (selectionLength - 1 === i) {
          return {
            ...sel,
            inProgress: false,
          };
        }
        return sel;
      });
    }
  }

  function handleMouseMove(e: MouseEvent) {
    /* Exit if user is not in selection mode */
    if (!isSelecting.value || !props.wrap.value) return;

    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);

    if (!coords) return;

    if (
      mouseMoveInterceptor?.(
        e,
        coords,
        unref(selectionStart),
        unref(selectionEnd)
      ) === false
    ) {
      return;
    }

    if (isEqualCells(firstActiveCell.value, coords)) {
      return clearSelections();
    }

    modifySelection(coords, true);

    scrollToItem(coords);
  }

  function newSelection(start: CellInterface, end: CellInterface = start) {
    /* Validate bounds */
    if (isCellOutOfBounds(start)) {
      return;
    }
    selectionStart.value = start;
    selectionEnd.value = end;
    const bounds = selectionFromStartEnd(start, end);
    if (!bounds) return;
    const coords = { rowIndex: bounds.top, columnIndex: bounds.left };
    /* Keep track  of first cell that was selected by user */
    activeCell.value = coords;
    if (newSelectionMode === "clear") {
      firstActiveCell.value = coords;
      clearSelections();
    } else if (newSelectionMode === "modify") {
      modifySelection(coords);
    } else {
      appendSelection(coords);
    }
  }

  function modifySelection(coords: CellInterface, setInProgress?: boolean) {
    if (selectionPolicy === "single") {
      return;
    }
    if (!selectionStart.value) return;
    if (isCellOutOfBounds(coords)) {
      return;
    }
    selectionEnd.value = coords;
    const bounds = selectionFromStartEnd(selectionStart.value, coords);
    if (!bounds) return;

    /**
     * 1. Multiple selections on mousedown/mousemove
     * 2. Move the activeCell to newly selection. Done by appendSelection
     */
    let selectionLength = unref(selections).length;
    if (!selectionLength) {
      selections.value = [{ bounds, inProgress: setInProgress ? true : false }];
      return;
    } else {
      selections.value = selections.value.map((sel, i) => {
        if (selectionLength - 1 === i) {
          return {
            ...sel,
            bounds,
            inProgress: setInProgress ? true : false,
          };
        }
        return sel;
      });
    }
  }

  function clearSelections() {
    selections.value = [];
  }

  function cellIndexInSelection(
    cell: CellInterface,
    selections: SelectionArea[]
  ) {
    const id = cellIdentifier(
      Math.max(selectionTopBound, cell.rowIndex),
      Math.max(selectionLeftBound, cell.columnIndex)
    );
    return selections.findIndex((sel) => {
      const boundedCells = getBoundedCells(sel.bounds);
      return boundedCells.has(id);
    });
  }

  function isCellOutOfBounds(cell: CellInterface) {
    return (
      cell.rowIndex < selectionTopBound || cell.columnIndex < selectionLeftBound
    );
  }

  /**
   * selection object from start, end
   * @param start
   * @param end
   */
  function selectionFromStartEnd(start: CellInterface, end: CellInterface) {
    if (!props.wrap?.value) return null;
    const spanMerges = canSelectionSpanMergedCells?.(start, end);
    return cellRangeToBounds(start, end, spanMerges, getCellBounds);
  }

  /* Adds a new selection, CMD key */
  function appendSelection(start: CellInterface, end: CellInterface = start) {
    if (selectionPolicy !== "multiple") {
      return;
    }
    if (!start) return;
    /* Validate bounds */
    if (isCellOutOfBounds(start)) {
      return;
    }
    selectionStart.value = start;
    selectionEnd.value = end;
    const bounds = selectionFromStartEnd(start, end);
    if (!bounds) return;
    activeCell.value = { rowIndex: bounds.top, columnIndex: bounds.left };
    selections.value = [...selections.value, { bounds }];
  }

  function removeSelectionByIndex(index: number): SelectionArea[] {
    const newSelection = unref(selections).filter((_, idx) => idx !== index);
    selections.value = newSelection;
    return newSelection;
  }

  function getPossibleActiveCellFromSelections(
    selections: SelectionArea[]
  ): CellInterface | null {
    if (!selections.length) return null;
    const { bounds } = selections[selections.length - 1];
    return {
      rowIndex: bounds.top,
      columnIndex: bounds.left,
    };
  }

  function cellEqualsSelection(
    cell: CellInterface | null,
    selections: SelectionArea[]
  ): boolean {
    if (cell === null) return false;
    return selections.some((sel) => {
      return (
        sel.bounds.left === cell.columnIndex &&
        sel.bounds.top === cell.rowIndex &&
        sel.bounds.right === cell.columnIndex &&
        sel.bounds.bottom === cell.rowIndex
      );
    });
  }

  return {
    selectionChildren,
  };
}
