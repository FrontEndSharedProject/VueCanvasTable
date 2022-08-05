/**
 * 选区功能
 */
import {
  computed,
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
import { useSelectionHotkeys } from "@/Grid/hooks/useSelectionHotkeys";
import { useStore } from "@/hooks/useStore";

type Props = {
  wrap: Ref<HTMLDivElement | undefined>;
};

type ReturnType = {
  selectionChildren: ShallowRef<VNode | undefined>;
};

export function useSelection(props: Props): ReturnType {
  //  参数
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

  const { getCellCoordsFromOffset, scrollToItem, getCellBounds, getViewPort } =
    useExpose();
  const { rowCount, columnCount } = useStore();

  const selections = ref<SelectionArea[]>([]);
  const isSelecting = ref<boolean>(false);
  const selectionStart = ref<CellInterface | null>(null);
  const selectionEnd = ref<CellInterface | null>(null);
  const firstActiveCell = ref<CellInterface | null>(null);
  const activeCell = ref<CellInterface | null>(null);
  const fillSelection = ref<SelectionArea | null>(null);

  const selectionTopBound = computed(() => 0);
  const selectionBottomBound = computed(() => unref(rowCount) - 1);
  const selectionLeftBound = computed(() => 0);
  const selectionRightBound = computed(() => unref(columnCount) - 1);

  const { selectionChildren } = useSelectionRender({
    selections,
    activeCell,
    fillSelection,
    methods: {
      selectionFromStartEnd,
    },
  });
  useSelectionHotkeys({
    wrap: props.wrap,
    selectionStart,
    selectionEnd,
    activeCell,
    selections,
    firstActiveCell,
    selectionTopBound,
    selectionBottomBound,
    selectionLeftBound,
    selectionRightBound,
    modifySelection,
    newSelection,
    selectAll,
    selectFirstCellInColumn,
    selectFirstCellInRow,
    selectLastCellInColumn,
    selectLastCellInRow,
    scrollToActiveCell,
    selectColumn,
    selectRow,
    pageRight,
    pageDown,
    pageLeft,
    pageUp,
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
      Math.max(unref(selectionTopBound), cell.rowIndex),
      Math.max(unref(selectionLeftBound), cell.columnIndex)
    );
    return selections.findIndex((sel) => {
      const boundedCells = getBoundedCells(sel.bounds);
      return boundedCells.has(id);
    });
  }

  function isCellOutOfBounds(cell: CellInterface) {
    return (
      cell.rowIndex < unref(selectionTopBound) ||
      cell.columnIndex < unref(selectionLeftBound)
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

  function selectAll() {
    selectionStart.value = {
      rowIndex: unref(selectionTopBound),
      columnIndex: unref(selectionLeftBound),
    };
    modifySelection({
      rowIndex: unref(selectionBottomBound),
      columnIndex: unref(selectionRightBound),
    });
  }

  function selectFirstCellInColumn() {
    if (!selectionStart.value) return;
    const cell = {
      rowIndex: unref(selectionTopBound),
      columnIndex: selectionStart.value.columnIndex,
    };
    newSelection(cell);

    scrollToItem(cell);
  }

  function selectFirstCellInRow() {
    if (!selectionStart.value) return;

    const cell = {
      rowIndex: selectionStart.value.rowIndex,
      columnIndex: unref(selectionLeftBound),
    };
    newSelection(cell);

    scrollToItem(cell);
  }

  function selectLastCellInColumn() {
    if (!selectionStart.value) return;
    const cell = {
      rowIndex: unref(rowCount) - 1,
      columnIndex: selectionStart.value.columnIndex,
    };
    newSelection(cell);
    scrollToItem(cell);
  }

  function selectLastCellInRow() {
    if (!selectionStart.value) return;

    const cell = {
      rowIndex: selectionStart.value.rowIndex,
      columnIndex: unref(selectionRightBound),
    };
    newSelection(cell);
    scrollToItem(cell);
  }

  function scrollToActiveCell() {
    if (!activeCell.value) return;
    scrollToItem(activeCell.value);
  }

  function selectColumn() {
    if (!selectionEnd.value || !selectionStart.value) return;
    selectionStart.value = {
      rowIndex: unref(selectionTopBound),
      columnIndex: selectionStart.value.columnIndex,
    };
    modifySelection({
      rowIndex: unref(rowCount) - 1,
      columnIndex: selectionEnd.value.columnIndex,
    });
  }

  function selectRow() {
    if (!selectionEnd.value || !selectionStart.value) return;
    selectionStart.value = {
      rowIndex: selectionStart.value.rowIndex,
      columnIndex: unref(selectionLeftBound),
    };
    modifySelection({
      rowIndex: selectionEnd.value.rowIndex,
      columnIndex: unref(selectionRightBound),
    });
  }

  function pageRight() {
    if (!activeCell.value) return;
    const { visibleColumnStartIndex, visibleColumnStopIndex } = getViewPort();
    const pageSize = visibleColumnStopIndex - visibleColumnStartIndex;
    const columnIndex = Math.min(
      activeCell.value.columnIndex + pageSize,
      unref(selectionRightBound)
    );
    const newActiveCell = {
      columnIndex,
      rowIndex: activeCell.value.rowIndex,
    };
    handleSetActiveCell(newActiveCell, false);
    /* Scroll to the new row */
    scrollToItem({ columnIndex });
  }

  function pageDown() {
    if (!activeCell.value) return;
    const { visibleRowStartIndex, visibleRowStopIndex } = getViewPort();
    const pageSize = visibleRowStopIndex - visibleRowStartIndex;
    const rowIndex = Math.min(
      activeCell.value.rowIndex + pageSize,
      unref(rowCount) - 1
    );
    const newActiveCell = {
      rowIndex,
      columnIndex: activeCell.value.columnIndex,
    };
    handleSetActiveCell(newActiveCell, false);
    /* Scroll to the new row */
    scrollToItem({ rowIndex });
  }

  function pageLeft() {
    if (!activeCell.value) return;
    const { visibleColumnStartIndex, visibleColumnStopIndex } = getViewPort();
    const pageSize = visibleColumnStopIndex - visibleColumnStartIndex;
    const columnIndex = Math.max(
      activeCell.value.columnIndex - pageSize,
      unref(selectionLeftBound)
    );
    const newActiveCell = {
      columnIndex,
      rowIndex: activeCell.value.rowIndex,
    };
    handleSetActiveCell(newActiveCell, false);
    /* Scroll to the new row */
    scrollToItem({ columnIndex });
  }

  function pageUp() {
    if (!activeCell.value) return;
    const { visibleRowStartIndex, visibleRowStopIndex } = getViewPort();
    const pageSize = visibleRowStopIndex - visibleRowStartIndex;
    const rowIndex = Math.max(
      activeCell.value.rowIndex - pageSize,
      unref(selectionTopBound)
    );
    const newActiveCell = {
      rowIndex,
      columnIndex: activeCell.value.columnIndex,
    };
    handleSetActiveCell(newActiveCell, false);
    /* Scroll to the new row */
    scrollToItem({ rowIndex });
  }

  function handleSetActiveCell(
    coords: CellInterface | null,
    shouldScroll = true
  ) {
    selectionStart.value = coords;
    firstActiveCell.value = coords;
    selectionEnd.value = coords;
    activeCell.value = coords;
    /* Scroll to the cell */
    if (shouldScroll && coords) {
      scrollToItem(coords);
    }
  }

  return {
    selectionChildren,
  };
}
