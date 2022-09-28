import {
  computed,
  ComputedRef,
  markRaw,
  onMounted,
  ref,
  ShallowRef,
  shallowRef,
  unref,
  VNode,
  watch,
} from "vue";
import { itemKey } from "$vct/helpers";
import { RendererProps } from "$vct/Cell/Cell";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useStore } from "$vct/hooks/useStore";
import { useDimensions } from "$vct/hooks/useDimensions";
import { RowHeaderProps } from "$vct/types";
import { debounce } from "lodash-es";

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
  cells: ShallowRef<CellsListData>;
  frozenColumnCells: ShallowRef<CellsListData>;
};

export function useCellRender(): ReturnType {
  const {
    scrollState,
    rowCount,
    frozenRows,
    frozenColumns,
    columnCount,
    columnAreaBounds,
    hiddenColumns,
    colWidths,
  } = useStore();
  const { rowHeaderWidth, contentWidth } = useDimensions();
  const {
    getCellBounds,
    getRowOffset,
    getColumnByColIndex,
    getColumnOffset,
    getRowHeight,
    getColumnWidth,
    isReadonlyCell,
    isHaveNote,
  } = useExpose();

  const cells = shallowRef<CellsListData>([]);
  const frozenColumnCells = shallowRef<CellsListData>([]);

  onMounted(() => {
    update();
  });

  watch(
    () => [scrollState, columnAreaBounds],
    () => {
      update();
    },
    {
      deep: true,
    }
  );

  function update() {
    if (!rowCount.value) return;
    updateCells();
    updateFrozenCells();
  }

  function updateFrozenCells() {
    const frozenColumnCellsArr: CellsListData = [];
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
          //  这里需要设置下 key，来确保在 column 位置改变后的自动刷新问题
          // prettier-ignore
          key: `${column.id}_${columnIndex}_${rowIndex}_${x + rowHeaderWidth.value}_${width}_${height}`,
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

      frozenColumnCellsArr.push(rowData);
    }

    frozenColumnCells.value = frozenColumnCellsArr;
  }

  function updateCells() {
    let cellsArr: CellsListData = [];
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
            //  这里需要设置下 key，来确保在 column 位置改变后的自动刷新问题
            // prettier-ignore
            key: `${column.id}_${columnIndex}_${rowIndex}_${x + rowHeaderWidth.value}_${width}_${height}`,
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
        cellsArr.push(rowData);
      }
    }

    cells.value = cellsArr;
  }

  return {
    cells,
    frozenColumnCells,
  };
}
