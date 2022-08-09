import { computed, ComputedRef, unref, VNode } from "vue";
import { useHelpers } from "@/hooks/useHelpers";
import { itemKey } from "@/helpers";
import { RendererProps } from "@/Cell/Cell";
import { useExpose } from "@/Grid/hooks/useExpose";
import { useStore } from "@/hooks/useStore";
import { useDimensions } from "@/hooks/useDimensions";
import { RowHeaderProps } from "@/types";

type CellRowData = {
  index: number;
  y: number;
  x: number;
  height: number;
  cells: RendererProps[];
  rowHeaderProps: RowHeaderProps;
};
type CellsListData = CellRowData[];

type ReturnType = {
  cells: ComputedRef<CellsListData>;
};

export function useCellRender(): ReturnType {
  const { getRowOffset, getColumnOffset, getRowHeight, getColumnWidth } =
    useHelpers();
  const {
    scrollState,
    rowCount,
    frozenRows,
    frozenColumns,
    columnCount,
    isHiddenRow,
  } = useStore();
  const { rowHeaderWidth } = useDimensions();
  const { getCellBounds } = useExpose();

  const cells = computed<CellsListData>(() => {
    let cells: CellsListData = [];

    if (unref(columnCount) && unref(rowCount)) {
      for (
        let rowIndex = scrollState.value.rowStartIndex;
        rowIndex <= scrollState.value.rowStopIndex;
        rowIndex++
      ) {
        /* Skip frozen rows */
        if (rowIndex < unref(frozenRows) || unref(isHiddenRow)?.(rowIndex)) {
          continue;
        }

        const actualRowIndex = rowIndex;
        const y = getRowOffset(actualRowIndex);
        const actualBottom = rowIndex;
        const height =
          getRowOffset(actualBottom) - y + getRowHeight(actualBottom);
        let rowData: CellRowData = {
          index: rowIndex,
          y: y,
          x: 0,
          height,
          cells: [],
          rowHeaderProps: {
            index: rowIndex,
            hover: false,
            x: scrollState.value.scrollLeft,
            y: 0,
            height,
            width: unref(rowHeaderWidth),
          },
        };

        for (
          let columnIndex = scrollState.value.columnStartIndex;
          columnIndex <= scrollState.value.columnStopIndex;
          columnIndex++
        ) {
          /**
           * Skip frozen columns
           * Skip merged cells that are out of bounds
           */
          if (columnIndex < unref(frozenColumns)) {
            continue;
          }

          const bounds = getCellBounds({ rowIndex, columnIndex });
          const actualColumnIndex = columnIndex;
          const actualRight = Math.max(columnIndex, bounds.right);

          const x = getColumnOffset(actualColumnIndex);

          const width =
            getColumnOffset(actualRight) - x + getColumnWidth(actualRight);
          rowData.cells.push({
            x: x + 40,
            y: 0,
            width,
            height,
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
            id: itemKey({
              rowIndex: actualRowIndex,
              columnIndex: actualColumnIndex,
            }),
          });
        }
        cells.push(rowData);
      }
    }

    return cells;
  });

  return {
    cells,
  };
}
