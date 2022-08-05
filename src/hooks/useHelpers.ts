import { useGlobalStore } from "@/store/global";
import { sum, cloneDeep } from "lodash-es";
import { Column } from "@/Grid/types";

type ReturnType = {
  getRowOffset(index: number): number;
  getColumnOffset(index: number): number;
  getRowHeight(index: number): number;
  getColumnWidth(index: number): number;
  getCellValueByCrood(rowIndex: number, colIndex: number): string;
};

export function useHelpers(): ReturnType {
  const globalStore = useGlobalStore();

  function getRowOffset(index: number): number {
    return sum(cloneDeep(globalStore.rowHeights as number[]).splice(0, index));
  }

  function getColumnOffset(index: number): number {
    return sum(cloneDeep(globalStore.colWidths as number[]).splice(0, index));
  }

  function getRowHeight(index) {
    return globalStore.rowHeights[index];
  }

  function getColumnWidth(index) {
    return globalStore.colWidths[index];
  }

  function getColumnByColIndex(colIndex: number): Column {
    return globalStore.columns[colIndex];
  }

  function getCellValueByCrood(rowIndex: number, colIndex: number): string {
    const column = getColumnByColIndex(colIndex);

    return globalStore.rows[rowIndex].fields[column.id];
  }

  return {
    getRowOffset,
    getColumnOffset,
    getRowHeight,
    getColumnWidth,
    getCellValueByCrood,
  };
}
