/**
 * 该文件用于处理 selection 上的快捷键
 */
import { ComputedRef, onBeforeUnmount, onMounted, Ref, unref } from "vue";
import { Direction, KeyCodes } from "@/enums";
import { CellInterface, SelectionArea } from "@/types";
import { useExpose } from "@/Grid/hooks/useExpose";
import {
  clampIndex,
  findNextCellInDataRegion,
  isEqualCells,
  findNextCellWithinBounds,
} from "@/helpers";
import { useStore } from "@/hooks/useStore";
import { useHelpers } from "@/hooks/useHelpers";

type Props = {
  wrap: Ref<HTMLDivElement | undefined>;
  selections: Ref<SelectionArea[]>;
  selectionStart: Ref<CellInterface | null>;
  selectionEnd: Ref<CellInterface | null>;
  activeCell: Ref<CellInterface | null>;
  firstActiveCell: Ref<CellInterface | null>;
  selectionTopBound: ComputedRef<number>;
  selectionBottomBound: ComputedRef<number>;
  selectionLeftBound: ComputedRef<number>;
  selectionRightBound: ComputedRef<number>;
  modifySelection(coords: CellInterface, setInProgress?: boolean): void;
  newSelection(start: CellInterface, end?: CellInterface): void;
  selectAll(): void;
  selectFirstCellInColumn(): void;
  selectFirstCellInRow(): void;
  selectLastCellInColumn(): void;
  selectLastCellInRow(): void;
  scrollToActiveCell(): void;
  selectColumn(): void;
  selectRow(): void;
  pageRight(): void;
  pageDown(): void;
  pageLeft(): void;
  pageUp(): void;
};

export function useSelectionHotkeys(props: Props) {
  const { getCellBounds, scrollToItem } = useExpose();
  const {
    isHiddenRow: isHiddenRowFn,
    isHiddenColumn: isHiddenColumnFn,
    rowCount,
    columnCount,
  } = useStore();
  const { getCellValueByCrood } = useHelpers();

  const isHiddenRow = unref(isHiddenRowFn);
  const isHiddenColumn = unref(isHiddenColumnFn);

  const getValue = ({ rowIndex, columnIndex }) => {
    return getCellValueByCrood(rowIndex, columnIndex);
  };

  onMounted(() => {
    if (props.wrap.value) {
      props.wrap.value?.addEventListener("keydown", handleKeyDown);
    }
  });

  onBeforeUnmount(() => {
    if (props.wrap.value) {
      props.wrap.value?.removeEventListener("keydown", handleKeyDown);
    }
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (!props.wrap.value) return;
    const isShiftKey = e.shiftKey;
    const isAltKey = e.altKey;
    const isMetaKey = e.ctrlKey || e.metaKey;

    switch (e.which) {
      case KeyCodes.Right:
        keyNavigate(Direction.Right, isShiftKey, isMetaKey);
        e.preventDefault();
        break;

      case KeyCodes.Left:
        keyNavigate(Direction.Left, isShiftKey, isMetaKey);
        e.preventDefault();
        break;

      // Up
      case KeyCodes.Up:
        keyNavigate(Direction.Up, isShiftKey, isMetaKey);
        e.preventDefault();
        break;

      case KeyCodes.Down:
        keyNavigate(Direction.Down, isShiftKey, isMetaKey);
        e.preventDefault();
        break;

      case KeyCodes.A:
        if (isMetaKey) {
          props.selectAll();
        }
        e.preventDefault();
        break;

      case KeyCodes.Home:
        if (isMetaKey) {
          props.selectFirstCellInColumn();
        } else {
          props.selectFirstCellInRow();
        }
        break;

      case KeyCodes.End:
        if (isMetaKey) {
          props.selectLastCellInColumn();
        } else {
          props.selectLastCellInRow();
        }
        break;

      case KeyCodes.BackSpace:
        if (isMetaKey) props.scrollToActiveCell();
        break;

      case KeyCodes.SPACE:
        if (isMetaKey && isShiftKey) {
          props.selectAll();
        } else if (isMetaKey) {
          props.selectColumn();
        } else if (isShiftKey) {
          props.selectRow();
        }
        break;

      case KeyCodes.Tab:
        /* Cycle through the selections if selections.length > 0 */
        if (props.selections.value.length && props.activeCell.value) {
          const { bounds } =
            props.selections.value[props.selections.value.length - 1];
          const activeCellBounds = getCellBounds(props.activeCell.value);
          const direction = isShiftKey ? Direction.Left : Direction.Right;
          const nextCell = findNextCellWithinBounds(
            activeCellBounds,
            bounds,
            direction
          );
          if (nextCell) {
            props.activeCell.value = nextCell;
            scrollToItem(nextCell);
          }
        } else {
          if (isShiftKey) {
            keyNavigate(Direction.Left);
          } else {
            keyNavigate(Direction.Right);
          }
        }
        e.preventDefault();
        break;

      case KeyCodes.PageDown:
        if (isAltKey) {
          props.pageRight();
        } else props.pageDown();
        break;

      case KeyCodes.PageUp:
        if (isAltKey) {
          props.pageLeft();
        } else props.pageUp();
        break;
    }
  }

  function keyNavigate(
    direction: Direction,
    modify?: boolean,
    metaKeyPressed?: boolean
  ) {
    if (
      !props.selectionStart.value ||
      !props.selectionEnd.value ||
      !props.wrap.value ||
      !props.activeCell.value
    )
      return;
    const currentCell = modify
      ? props.selectionEnd.value
      : props.activeCell.value;
    let { rowIndex, columnIndex } = currentCell;

    const currentBounds = getCellBounds({
      rowIndex,
      columnIndex,
    });

    switch (direction) {
      case Direction.Up:
        rowIndex = clampIndex(
          Math.max(rowIndex - 1, 0),
          isHiddenRow,
          direction
        );
        // Shift + Ctrl/Commmand
        // TODO: Scroll to last contentful cell
        if (metaKeyPressed) {
          const startCell = {
            ...currentCell,
            // Expand from the starting cell
            columnIndex: props.selectionStart.value.columnIndex,
          };
          rowIndex = findNextCellInDataRegion(
            startCell,
            getValue,
            isHiddenRow,
            direction,
            unref(props.selectionTopBound)
          );
        }
        break;

      case Direction.Down:
        rowIndex = clampIndex(
          Math.min(rowIndex + 1, unref(props.selectionBottomBound)),
          isHiddenRow,
          direction
        );
        // Shift + Ctrl/Commmand
        if (metaKeyPressed) {
          const startCell = {
            ...currentCell,
            // Expand from the starting cell
            columnIndex: props.selectionStart.value.columnIndex,
          };
          rowIndex = findNextCellInDataRegion(
            startCell,
            getValue,
            isHiddenRow,
            direction,
            unref(props.selectionBottomBound)
          );
        }
        break;

      case Direction.Left:
        columnIndex = clampIndex(
          Math.max(columnIndex - 1, unref(props.selectionLeftBound)),
          isHiddenColumn,
          direction
        );
        // Shift + Ctrl/Commmand
        if (metaKeyPressed) {
          const startCell = {
            ...currentCell,
            // Expand from the starting cell
            rowIndex: props.selectionStart.value.rowIndex,
          };
          columnIndex = findNextCellInDataRegion(
            startCell,
            getValue,
            isHiddenColumn,
            direction,
            unref(props.selectionLeftBound)
          );
        }
        break;

      case Direction.Right:
        columnIndex = clampIndex(
          Math.min(columnIndex + 1, unref(props.selectionRightBound)),
          isHiddenColumn,
          direction
        );
        // Shift + Ctrl/Commmand
        if (metaKeyPressed) {
          const startCell = {
            ...currentCell,
            // Expand from the starting cell
            rowIndex: props.selectionStart.value.rowIndex,
          };
          columnIndex = findNextCellInDataRegion(
            startCell,
            getValue,
            isHiddenColumn,
            direction,
            unref(props.selectionRightBound)
          );
        }
        break;
    }

    const newBounds = getCellBounds({
      rowIndex,
      columnIndex,
    });
    const coords = { rowIndex: newBounds.top, columnIndex: newBounds.left };
    const scrollToCell = modify
      ? props.selectionEnd.value.rowIndex === coords.rowIndex
        ? // Scroll to a column
          { columnIndex: coords.columnIndex }
        : // Scroll to row
          { rowIndex: coords.rowIndex }
      : // Scroll to cell
        { rowIndex, columnIndex };

    const isUserNavigatingToActiveCell = isEqualCells(
      props.firstActiveCell.value,
      coords
    );

    if (modify && !isUserNavigatingToActiveCell) {
      props.modifySelection(coords);
    } else {
      props.newSelection(coords);
    }

    /* Keep the item in view */
    scrollToItem(scrollToCell);
  }
}
