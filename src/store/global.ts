import { defineStore } from "pinia";
import type { GridProps } from "@/Grid/Grid.vue";
import { Direction } from "@/enums";
import { ScrollStateType } from "@/Grid/hooks/useScroll";
import { store } from "./store";

export const defaultState: Required<GridProps> = {
  width: 800,
  height: 600,
  defaultRowHeight: 30,
  defaultColWidth: 120,
  columnHeight: 60,
  rowHeaderWidth: 40,
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
  refs: {
    tableRef: HTMLDivElement | undefined;
    stageRef: any;
    stageContainerRef: HTMLDivElement | undefined;
    verticalScrollRef: HTMLDivElement | undefined;
    horizontalScrollRef: HTMLDivElement | undefined;
  };
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
      visibleRowStartIndex: 0,
      visibleRowStopIndex: 0,
      visibleColumnStartIndex: 0,
      visibleColumnStopIndex: 0,
      columnStartIndex: 0,
      columnStopIndex: 0,
      isScrolling: false,
      verticalScrollDirection: Direction.Down,
      horizontalScrollDirection: Direction.Right,
    },
    frozenRows: 0,
    frozenColumns: 0,
    scrollbarSize: 13,
    refs: {
      tableRef: undefined,
      stageRef: undefined,
      stageContainerRef: undefined,
      verticalScrollRef: undefined,
      horizontalScrollRef: undefined,
    },
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
  actions: {
    setScrollState(payload) {
      this.scrollState = payload;
    },
  },
});

export function useGlobalStoreWithOut() {
  return useGlobalStore(store);
}
