import { defineStore } from "pinia";
//  @ts-ignore
import type { GridProps } from "$vct/Grid/Grid.vue";
import { Direction } from "$vct/enums";
import { ScrollStateType } from "$vct/Grid/hooks/useScroll";
import { store } from "./store";
import { AreaBounds, CellInterface, Note, SelectionArea } from "$vct/types";

export const defaultState: GridProps = {
  defaultRowHeight: 60,
  defaultColWidth: 120,
  columnHeight: 60,
  rowHeaderWidth: 40,
  columns: [],
  rowHeights: {},
  colWidths: {},
  columnGroups: {
    enable: false,
    configs: [],
  },
  hiddenColumns: [],
  frozenColumns: 0,
  //  行排序规则（快速排序）
  sortRowConfigs: [],
  //  行过滤
  filterRowsConfigs: [],
  contextMenuConfigs: null,
  GSCHandlers: [],
  notes: [],
  columnStatistics: {},
  columnHeaderRender: null,

  //  主题
  themes: {
    main: "#5583F1",
    textColor: "#262F4D",
    textColor2: "#676D82",
    lineColor: "#D5D9E3",
    borderRadius: "2px",
    cellBoxShadow: "0px 12px 20px 6px rgba(38, 47, 77, 0.2)",
    columnHeaderBackgroundColor: "#f7f8fc",
    columnHeaderBackgroundSelected: "#E9ECF4",
    columnHeaderBackgroundHover: "#E6ECFD",
    columnHeaderBackgroundDrag: "#aaa",
    menuListItemHoverColor: "#5583F1",
    scrollbarThumbBackground: "rgba(103, 109, 130, 0.4)",
    rowHoverBackground: "#E6ECFD",
  },

  //  hooks
  onCellBeforeRender: undefined,
};

type StateExtract = {
  //  用于强制更新 ui 的随机数
  _UiForceUpdateRandom: number;
  //  原始数据中 rows 的 order 排序，用于取消快速排序后的数据回复
  //  id 数组
  _originalRowsOrder: string[];
  //  为 useNote 提供一个 store 值
  //  当值改变时来显示 note，以此来实现 useExpose 中的 showNoteByCoord 方法
  _showNoteWatcher: CellInterface;
  scrollState: ScrollStateType;
  frozenRows: number;
  scrollbarSize: number;
  hiddenRows: string[];
  refs: {
    tableRef: HTMLDivElement | undefined;
    stageRef: any;
    stageContainerRef: HTMLDivElement | undefined;
    verticalScrollRef: HTMLDivElement | undefined;
    horizontalScrollRef: HTMLDivElement | undefined;
  };
  columnAreaBounds: AreaBounds[];
  rowAreaBounds: AreaBounds[];

  //  selection 相关
  selections: SelectionArea[];
  isSelecting: boolean;
  selectionStart: CellInterface | null;
  selectionEnd: CellInterface | null;
  firstActiveCell: CellInterface | null;
  activeCell: CellInterface | null;
  fillSelection: CellInterface | null;

  //  columns header 相关
  selectedColumns: number[];

  //  rows header 相关
  selectedRows: number[];
};

export type State = Required<GridProps> & StateExtract;

export const useGlobalStore = defineStore("global", {
  state: (): State => ({
    ...defaultState,
    _UiForceUpdateRandom: Math.random(),
    _originalRowsOrder: [],
    _showNoteWatcher: { rowIndex: -1, columnIndex: -1 },
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
    hiddenRows: [],
    frozenRows: 0,
    scrollbarSize: 6,
    refs: {
      tableRef: undefined,
      stageRef: undefined,
      stageContainerRef: undefined,
      verticalScrollRef: undefined,
      horizontalScrollRef: undefined,
    },
    columnAreaBounds: [],
    rowAreaBounds: [],

    //  selection 相关
    selections: [],
    isSelecting: false,
    selectionStart: null,
    selectionEnd: null,
    firstActiveCell: null,
    activeCell: null,
    fillSelection: null,

    //  columns header 相关
    selectedColumns: [],

    //  rows header 相关
    selectedRows: [],
  }),
  getters: {
    rowCount(state) {
      if (Array.isArray(state.rowAreaBounds)) return state.rowAreaBounds.length;
      return 0;
    },
    columnCount(state) {
      if (Array.isArray(state.columnAreaBounds))
        return state.columnAreaBounds.length;
      return 0;
    },
  },
  actions: {
    setScrollState(payload) {
      this.scrollState = payload;
    },
  },
});
