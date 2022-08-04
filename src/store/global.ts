import { defineStore } from "pinia";
import type { GridProps } from "@/Grid/Grid.vue";
import { Direction } from "@/Grid/enums";
import { ScrollStateType } from "@/Grid/hooks/useScroll";
import { store } from "./store";

export const defaultState: Required<GridProps> = {
  width: 800,
  height: 600,
  defaultRowHeight: 30,
  defaultColWidth: 120,
  columnHeight: 60,
  rowHeaderWidth:40,
  columns: [],
  rows: [],
  rowHeights: 30,
  colWidths: 120,
  isHiddenRow(index: number): boolean {
    return false;
  },
  isHiddenColumn(index: number): boolean {
    return false;
  },
};

type StateExtract = {
  scrollState: ScrollStateType;
  frozenRows: number;
  frozenColumns: number;
  scrollbarSize: number;
};

export type State = Required<GridProps> & StateExtract;

export const useGlobalStore = defineStore("global", {
  state: (): State => ({
    ...defaultState,
    scrollState: {
      isShowScrollbarX: false,
      isShowScrollbarY: false,
      contentWidth: 0,
      contentHeight: 0,
      scrollTop: 0,
      scrollLeft: 0,
      rowStartIndex: 0,
      rowStopIndex: 0,
      columnStartIndex: 0,
      columnStopIndex: 0,
      isScrolling: false,
      verticalScrollDirection: Direction.Down,
      horizontalScrollDirection: Direction.Right,
    },
    frozenRows: 0,
    frozenColumns: 0,
    scrollbarSize: 13,
  }),
  getters: {
    rowCount(state) {
      if (Array.isArray(state.rowHeights)) return state.rowHeights.length;
      return 0;
    },
    columnCount(state) {
      if (Array.isArray(state.colWidths)) return state.colWidths.length;
      return 0;
    },
  },
  actions: {},
});

export function useGlobalStoreWithOut() {
  return useGlobalStore(store);
}
