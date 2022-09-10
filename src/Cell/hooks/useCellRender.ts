import { computed, ComputedRef, markRaw, unref, VNode } from "vue";
import { itemKey } from "$vct/helpers";
import { RendererProps } from "$vct/Cell/Cell";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useStore } from "$vct/hooks/useStore";
import { useDimensions } from "$vct/hooks/useDimensions";
import { RowHeaderProps } from "$vct/types";

type CellRowData = {
  index: number;
  y: number;
  x: number;
  height: number;
  width: number;
  cells: RendererProps[];
  rowHeaderProps: RowHeaderProps;
};
type CellsListData = CellRowData[];

type ReturnType = {
  cells: ComputedRef<CellsListData>;
  frozenColumnCells: ComputedRef<CellsListData>;
};

export function useCellRender(): ReturnType {
  const { scrollState, rowCount, frozenRows, frozenColumns, columnCount } =
    useStore();
  const { rowHeaderWidth, contentWidth } = useDimensions();
  const {
    getCellBounds,
    getRowOffset,
    getColumnByColIndex,
    getColumnOffset,
    getRowHeight,
    getColumnWidth,
    isReadonlyCell,
  } = useExpose();

  const cells = computed<CellsListData>(() => {
    let cells: CellsListData = [];
    const rowStartIndex = scrollState.value.rowStartIndex;
    const rowStopIndex = scrollState.value.rowStopIndex;
    const columnStartIndex = scrollState.value.columnStartIndex;
    const columnStopIndex = scrollState.value.columnStopIndex;

    if (unref(columnCount) && unref(rowCount)) {
      for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
        /* Skip frozen rows */
        if (rowIndex < unref(frozenRows)) {
          continue;
        }

        const actualRowIndex = rowIndex;
        const y = getRowOffset(actualRowIndex);
        const actualBottom = rowIndex;
        const height =
          getRowOffset(actualBottom) - y + getRowHeight(actualBottom);

        const width = contentWidth.value;

        let rowData: CellRowData = {
          index: rowIndex,
          y: y,
          x: 0,
          height,
          width,
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
          let columnIndex = columnStartIndex;
          columnIndex <= columnStopIndex;
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
          const column = getColumnByColIndex(actualColumnIndex);
          const readonly = isReadonlyCell({
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
          });

          rowData.cells.push({
            x: x + rowHeaderWidth.value,
            y: 0,
            width,
            height,
            readonly,
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
            column,
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

  //  计算冻结列的 cells
  const frozenColumnCells = computed<CellsListData>(() => {
    const frozenColumnCells: CellsListData = [];
    const rowStartIndex = scrollState.value.rowStartIndex;
    const rowStopIndex = scrollState.value.rowStopIndex;
    const columnStartIndex = scrollState.value.columnStartIndex;
    const columnStopIndex = scrollState.value.columnStopIndex;

    for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
      if (rowIndex < frozenRows.value) {
        continue;
      }

      const actualRowIndex = rowIndex;
      const actualBottom = rowIndex;

      const y = getRowOffset(actualRowIndex);
      const height =
        getRowOffset(actualBottom) - y + getRowHeight(actualBottom);
      const width = contentWidth.value;

      let rowData: CellRowData = {
        index: rowIndex,
        y: y,
        x: 0,
        height,
        width,
        cells: [],
        rowHeaderProps: {
          index: rowIndex,
          hover: false,
          x: 0,
          y: 0,
          height,
          width: unref(rowHeaderWidth),
        },
      };

      for (
        let columnIndex = 0;
        columnIndex < Math.min(columnStopIndex, frozenColumns.value);
        columnIndex++
      ) {
        const bounds = getCellBounds({ rowIndex, columnIndex });
        const actualColumnIndex = columnIndex;
        const actualRight = Math.max(columnIndex, bounds.right);

        const x = getColumnOffset(actualColumnIndex);

        const width =
          getColumnOffset(actualRight) - x + getColumnWidth(actualRight);
        const column = getColumnByColIndex(actualColumnIndex);
        const readonly = isReadonlyCell({
          rowIndex: actualRowIndex,
          columnIndex: actualColumnIndex,
        });

        rowData.cells.push({
          x: x + rowHeaderWidth.value,
          y: 0,
          width,
          height,
          readonly,
          rowIndex: actualRowIndex,
          columnIndex: actualColumnIndex,
          column,
          id: itemKey({
            rowIndex: actualRowIndex,
            columnIndex: actualColumnIndex,
          }),
        });
      }

      frozenColumnCells.push(rowData);
    }

    return frozenColumnCells;
  });

  return {
    cells,
    frozenColumnCells,
  };
}
