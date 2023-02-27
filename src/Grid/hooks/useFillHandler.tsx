import {
  AreaProps,
  CellInterface,
  PosXYRequired,
  SelectionArea,
} from "$vct/types";
import { inject, Ref, ref, unref, VNode } from "vue";
import { FillHandler } from "$vct/Grid/components/FIllHandler";
import { useStore } from "$vct/hooks/useStore";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { Direction } from "$vct/enums";
import { useSensitiveOperation } from "$vct/hooks/useSensitiveOperation";
import {
  flatSelectionsTo2DimArr,
  flatSelectionsToCellInterfaceArr,
} from "$vct/helpers";
import { cloneDeep } from "lodash-es";

/**
 * 此文件用于处理 fill handler 的逻辑（选区中）
 */

type Props = {
  activeCell: Ref<CellInterface | null>;
  selections: Ref<SelectionArea[]>;
  fillSelection: Ref<SelectionArea | null>;
  methods: any;
  setFillSelection(val: SelectionArea | null): void;
  setSelections(val: SelectionArea[]): void;
};

type GetFillHandlerVNodeProps = {
  fillHandleDimension: PosXYRequired;
  stroke: string;
  size: number;
  borderColor: string;
};

type ReturnType = {
  getFillHandlerVNode(payload: GetFillHandlerVNodeProps): VNode;
};

function onFill(
  activeCell: CellInterface,
  selection: SelectionArea | null,
  selections: SelectionArea[]
) {}

export function useFillHandler(props: Props): ReturnType {
  const selectionFromStartEnd = props.methods.selectionFromStartEnd;

  const { tableRef, columnCount, rowCount } = useStore();
  const { showConfirm } = useSensitiveOperation();

  const {
    getCellCoordsFromOffset,
    getCellBounds,
    scrollToItem,
    focusStageContainer,
    getCellValueByCoord,
    setCellValueByCoord,
  } = useExpose();

  const isFilling = ref<boolean>(false);

  function handleMousedown(e: MouseEvent) {
    e.stopPropagation();
    isFilling.value = true;
    document.addEventListener("mousemove", handleFillHandleMouseMove);
    document.addEventListener("mouseup", handleFillHandleMouseUp);
  }

  function handleFillHandleMouseMove(e: MouseEvent) {
    /* Exit if user is not in selection mode */
    if (!isFilling.value || !tableRef?.value || !props.activeCell.value) return;

    const coords = getCellCoordsFromOffset(e.clientX, e.clientY, false);
    if (!coords) return;
    const selections = props.selections.value;
    let bounds = selectionFromStartEnd(props.activeCell.value, coords);
    const hasSelections = selections.length > 0;
    const activeCellBounds = hasSelections
      ? selections[selections.length - 1].bounds
      : getCellBounds(props.activeCell.value);
    if (!bounds) return;

    const selectionRightBound = unref(columnCount) - 1;
    const selectionBottomBound = unref(rowCount) - 1;
    const selectionTopBound = 0;
    const selectionLeftBound = 0;

    const direction =
      bounds.top < activeCellBounds.top
        ? Direction.Up
        : bounds.bottom > activeCellBounds.bottom
        ? Direction.Down
        : bounds.right > activeCellBounds.right
        ? Direction.Right
        : Direction.Left;

    if (direction === Direction.Right) {
      bounds = {
        ...activeCellBounds,
        right: Math.min(selectionRightBound, bounds.right),
      };
    }

    if (direction === Direction.Up) {
      bounds = {
        ...activeCellBounds,
        top: Math.max(selectionTopBound, bounds.top),
      };
    }

    if (direction === Direction.Left) {
      bounds = {
        ...activeCellBounds,
        left: Math.max(selectionLeftBound, bounds.left),
      };
    }

    if (direction === Direction.Down) {
      bounds = {
        ...activeCellBounds,
        bottom: Math.min(selectionBottomBound, bounds.bottom),
      };
    }

    /**
     * If user moves back to the same selection, clear
     */
    if (
      hasSelections &&
      boundsSubsetOfSelection(bounds, selections[0].bounds)
    ) {
      props.setFillSelection(null);
      return;
    }

    props.setFillSelection({ bounds });

    scrollToItem(coords);
  }

  function handleFillHandleMouseUp(e: MouseEvent) {
    isFilling.value = false;

    /* Remove listener */
    document.removeEventListener("mousemove", handleFillHandleMouseMove);
    document.removeEventListener("mouseup", handleFillHandleMouseUp);

    /* Exit early */
    if (!tableRef.value || !props.activeCell.value) return;

    /* Update last selection */
    let fillSelection: SelectionArea | null = null;

    fillSelection = props.fillSelection.value;
    props.setFillSelection(null);

    /* Use ref, as we are binding to document */
    const selections = props.selections.value;
    const activeCell = props.activeCell.value;
    if (!activeCell || !fillSelection) return;

    const newBounds = (fillSelection as SelectionArea)?.bounds;
    if (!newBounds) return;

    /* Focus on the grid */
    focusStageContainer();

    /* Callback */
    onFill && onFill(activeCell, fillSelection, selections);

    if (fillSelection) {
      const { bounds } = fillSelection;
      const changes = {};
      const value = getCellValueByCoord({
        rowIndex: activeCell.rowIndex,
        columnIndex: activeCell.columnIndex,
      });

      //  todo fill
      showConfirm(flatSelectionsToCellInterfaceArr([{ bounds }]).length).then(
        (res) => {
          if (res) {
            if (fillSelection && activeCell) {
              let direction: string = "right";

              const cellsRange = selections[0]
                ? selections[0].bounds
                : {
                    left: activeCell.columnIndex,
                    right: activeCell.columnIndex,
                    top: activeCell.rowIndex,
                    bottom: activeCell.rowIndex,
                  };
              const fillRange = fillSelection.bounds;

              //  计算 direction
              if (
                cellsRange.left === fillRange.left &&
                cellsRange.right !== fillRange.right
              ) {
                direction = "right";
              } else if (
                cellsRange.left !== fillRange.left &&
                cellsRange.right === fillRange.right
              ) {
                direction = "left";
              } else if (
                cellsRange.bottom !== fillRange.bottom &&
                cellsRange.top === fillRange.top
              ) {
                direction = "bottom";
              } else {
                direction = "top";
              }

              const cells: Array<Array<CellInterface & { value: string }>> = []; // 存储单元格数组
              const fillCells: Array<CellInterface & { value?: string }> = []; // 存储要填充的单元格数组
              const updateRanges: Array<
                Array<CellInterface & { value: string }>
              > = [];

              // 遍历 cells 范围中的所有单元格
              for (let row = cellsRange.top; row <= cellsRange.bottom; row++) {
                const rowData: Array<CellInterface & { value: string }> = [];
                for (
                  let col = cellsRange.left;
                  col <= cellsRange.right;
                  col++
                ) {
                  rowData.push({
                    rowIndex: row,
                    columnIndex: col,
                    value: getCellValueByCoord({
                      rowIndex: row,
                      columnIndex: col,
                    }),
                  });
                }

                cells.push(rowData);
              }

              // 遍历 fillRange 范围中的所有单元格
              for (let row = fillRange.top; row <= fillRange.bottom; row++) {
                for (let col = fillRange.left; col <= fillRange.right; col++) {
                  fillCells.push({ rowIndex: row, columnIndex: col }); // 将每个单元格添加到 fillCells 数组中
                }
              }

              // 根据方向填充单元格
              if (direction === "right") {
                for (let i = 0; i < fillCells.length; i++) {
                  const cell = fillCells[i];

                  const colLength = cellsRange.right - cellsRange.left + 1;
                  const colIndex = cell.columnIndex - fillRange.left;
                  const rowIndex = cell.rowIndex - fillRange.top;
                  const value = cells[rowIndex][colIndex % colLength].value;
                  updateRanges[rowIndex] = updateRanges[rowIndex] || [];
                  updateRanges[rowIndex][colIndex] = {
                    rowIndex: cell.rowIndex,
                    columnIndex: cell.columnIndex,
                    value: value,
                  };
                }
              } else if (direction === "left") {
                for (let i = fillCells.length - 1; i >= 0; i--) {
                  const cell = fillCells[i];

                  const colLength = cellsRange.right - cellsRange.left + 1;
                  const fillLength = fillRange.right - fillRange.left + 1;
                  let colIndex = cell.columnIndex - fillRange.left;
                  const rowIndex = cell.rowIndex - fillRange.top;

                  let valueIndex =
                    colIndex < colLength ? colLength + colIndex : colIndex;
                  let offset = fillLength % colLength;
                  valueIndex = (valueIndex - offset) % colLength;

                  const value = cells[rowIndex][valueIndex].value;
                  updateRanges[rowIndex] = updateRanges[rowIndex] || [];
                  updateRanges[rowIndex][colIndex] = {
                    rowIndex: cell.rowIndex,
                    columnIndex: cell.columnIndex,
                    value: value,
                  };
                }
              } else if (direction === "top") {
                for (let i = 0; i < fillCells.length; i++) {
                  const cell = fillCells[i];

                  const rowLength = cellsRange.bottom - cellsRange.top + 1;
                  const fillLength = fillRange.bottom - fillRange.top + 1;
                  const colIndex = cell.columnIndex - fillRange.left;
                  const rowIndex = cell.rowIndex - fillRange.top;

                  let valueIndex =
                    rowIndex < rowLength ? rowLength + rowIndex : rowIndex;
                  let offset = fillLength % rowLength;
                  valueIndex = (valueIndex - offset) % rowLength;

                  const value = cells[valueIndex][colIndex].value;
                  updateRanges[rowIndex] = updateRanges[rowIndex] || [];
                  updateRanges[rowIndex][colIndex] = {
                    rowIndex: cell.rowIndex,
                    columnIndex: cell.columnIndex,
                    value: value,
                  };

                  console.log(updateRanges);
                }
              } else if (direction === "bottom") {
                for (let i = fillCells.length - 1; i >= 0; i--) {
                  const cell = fillCells[i];

                  const rowLength = cellsRange.bottom - cellsRange.top + 1;
                  const colIndex = cell.columnIndex - fillRange.left;
                  const rowIndex = cell.rowIndex - fillRange.top;
                  const value = cells[rowIndex % rowLength][colIndex].value;
                  updateRanges[rowIndex] = updateRanges[rowIndex] || [];
                  updateRanges[rowIndex][colIndex] = {
                    rowIndex: cell.rowIndex,
                    columnIndex: cell.columnIndex,
                    value: value,
                  };
                }
              }

              //  更新
              for (let row of updateRanges) {
                for (let cell of row) {
                  setCellValueByCoord(
                    { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex },
                    cell.value
                  );
                }
              }
            }
          }
        }
      );
    }

    /* Modify last selection */
    const selectionsLength = props.selections.value.length;
    if (!selectionsLength) {
      props.setSelections([{ bounds: newBounds }]);
    } else {
      props.setSelections(
        props.selections.value.map((sel, i) => {
          if (selectionsLength - 1 === i) {
            return {
              ...sel,
              bounds: newBounds,
            };
          }
          return sel;
        })
      );
    }
  }

  function boundsSubsetOfSelection(bounds: AreaProps, selection: AreaProps) {
    return (
      bounds.top >= selection.top &&
      bounds.bottom <= selection.bottom &&
      bounds.left >= selection.left &&
      bounds.right <= selection.right
    );
  }

  function getFillHandlerVNode(payload: GetFillHandlerVNodeProps): VNode {
    return (
      <FillHandler
        {...payload.fillHandleDimension}
        stroke={payload.stroke}
        size={payload.size}
        borderColor={payload.borderColor}
        onMousedown={handleMousedown}
      />
    );
  }

  return {
    getFillHandlerVNode,
  };
}
