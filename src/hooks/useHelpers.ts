import { sum, cloneDeep } from "lodash-es";
import { Column } from "@/Grid/types";
import { useStore } from "@/hooks/useStore";
import { useColumnsGroupData } from "@/hooks/useColumnsGroupData";
import { unref } from "vue";

type ReturnType = {
  getRowOffset(index: number, pure?: boolean): number;
  getColumnOffset(index: number): number;
  getRowHeight(index: number): number;
  getColumnWidth(index: number): number;
  getCellValueByCrood(rowIndex: number, colIndex: number): string;
};

export function useHelpers(): ReturnType {
  const { rowHeights, colWidths, columns, rows } = useStore();
  const { rowsOffsetTops } = useColumnsGroupData();

  function getRowOffset(index: number, pure: boolean = false): number {
    const rowOffsetTop = sum(cloneDeep(rowHeights.value).splice(0, index));
    if (pure) {
      return rowOffsetTop;
    } else {
      const columnGroupOffsetTop = rowsOffsetTops.value[index] ?? 0;
      return rowOffsetTop + columnGroupOffsetTop;
    }
  }

  function getColumnOffset(index: number): number {
    return sum(cloneDeep(colWidths.value).splice(0, index));
  }

  function getRowHeight(index) {
    return rowHeights.value[index];
  }

  function getColumnWidth(index) {
    return colWidths.value[index];
  }

  function getColumnByColIndex(colIndex: number): Column {
    return columns.value[colIndex];
  }

  function getCellValueByCrood(rowIndex: number, colIndex: number): string {
    const column = getColumnByColIndex(colIndex);

    return rows.value[rowIndex].fields[column.id];
  }

  return {
    getRowOffset,
    getColumnOffset,
    getRowHeight,
    getColumnWidth,
    getCellValueByCrood,
  };
}
