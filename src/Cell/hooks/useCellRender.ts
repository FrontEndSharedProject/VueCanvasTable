import { useGlobalStore } from "@/store/global";
import { computed, VNode } from "vue";
import { useHelpers } from "@/hooks/useHelpers";
import { itemKey } from "@/helpers";
import { RendererProps } from "@/Cell/Cell";
import { AreaProps, CellInterface } from "@/types";

export function useCellRender() {
  const globalStore = useGlobalStore();

  const { getRowOffset, getColumnOffset, getRowHeight, getColumnWidth } =
    useHelpers();

  const cells = computed(() => {
    let cells: RendererProps[] = [];

    if (globalStore.columnCount && globalStore.rowCount) {
      for (
        let rowIndex = globalStore.scrollState.rowStartIndex;
        rowIndex <= globalStore.scrollState.rowStopIndex;
        rowIndex++
      ) {
        /* Skip frozen rows */
        if (
          rowIndex < globalStore.frozenRows ||
          globalStore.isHiddenRow?.(rowIndex)
        ) {
          continue;
        }

        for (
          let columnIndex = globalStore.scrollState.columnStartIndex;
          columnIndex <= globalStore.scrollState.columnStopIndex;
          columnIndex++
        ) {
          /**
           * Skip frozen columns
           * Skip merged cells that are out of bounds
           */
          if (columnIndex < globalStore.frozenColumns) {
            continue;
          }

          const bounds = getCellBounds({ rowIndex, columnIndex });
          const actualRowIndex = rowIndex;
          const actualColumnIndex = columnIndex;
          const actualBottom = Math.max(rowIndex, bounds.bottom);
          const actualRight = Math.max(columnIndex, bounds.right);

          const y = getRowOffset(actualRowIndex);
          const height =
            getRowOffset(actualBottom) - y + getRowHeight(actualBottom);

          const x = getColumnOffset(actualColumnIndex);

          const width =
            getColumnOffset(actualRight) - x + getColumnWidth(actualRight);

          cells.push({
            x,
            y,
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
      }
    }

    return cells;
  });

  function getCellBounds({ rowIndex, columnIndex }: CellInterface): AreaProps {
    return {
      top: rowIndex,
      left: columnIndex,
      right: columnIndex,
      bottom: rowIndex,
    } as AreaProps;
  }

  return {
    cells,
  };
}
