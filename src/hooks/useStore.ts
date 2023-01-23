import { computed, ComputedRef, onBeforeUnmount } from "vue";
import { useGlobalStore } from "$vct/store/global";
import { ScrollStateType } from "$vct/Grid/hooks/useScroll";
import { Column, Row, ThemesConfig } from "$vct/Grid/types";
import {
  AreaBounds,
  CellInterface,
  FilterRowsConfig,
  SelectionArea,
  SortRowsConfig,
} from "$vct/types";

type ReturnType = {
  rowHeights: ComputedRef<number>;
  colWidths: ComputedRef<Record<string, number>>;
  columnAreaBounds: ComputedRef<AreaBounds[]>;
  rowAreaBounds: ComputedRef<AreaBounds[]>;
  defaultColWidth: ComputedRef<number>;
  defaultRowHeight: ComputedRef<number>;
  scrollState: ComputedRef<ScrollStateType>;
  stageRef: ComputedRef<any>;
  tableRef: ComputedRef<HTMLDivElement | undefined>;
  horizontalScrollRef: ComputedRef<HTMLDivElement | undefined>;
  verticalScrollRef: ComputedRef<HTMLDivElement | undefined>;
  stageContainerRef: ComputedRef<HTMLDivElement | undefined>;
  frozenRows: ComputedRef<number>;
  frozenColumns: ComputedRef<number>;
  scrollTop: ComputedRef<number>;
  scrollLeft: ComputedRef<number>;
  columnCount: ComputedRef<number>;
  rowCount: ComputedRef<number>;
  rows: ComputedRef<Row[]>;
  columns: ComputedRef<Column[]>;
  hiddenColumns: ComputedRef<string[]>;
  hiddenRows: ComputedRef<string[]>;
  selectedColumns: ComputedRef<number[]>;
  selectedRows: ComputedRef<number[]>;
  themes: ComputedRef<ThemesConfig>;
  sortRowConfigs: ComputedRef<SortRowsConfig[]>;
  filterRowsConfigs: ComputedRef<FilterRowsConfig[]>;
  selections: ComputedRef<SelectionArea[]>;
  activeCell: ComputedRef<CellInterface>;
};

let cache: ReturnType | null = null;

export function useStore(): ReturnType {
  if (cache) return cache;

  const globalStore = useGlobalStore();
  // const { rowsData } = useColumnsGroupData();

  const rowHeights = computed(() => globalStore.rowHeights);
  const colWidths = computed(() => globalStore.colWidths);
  const columnAreaBounds = computed(() => globalStore.columnAreaBounds);
  const rowAreaBounds = computed(() => globalStore.rowAreaBounds);
  const defaultColWidth = computed(() => globalStore.defaultColWidth as number);
  const defaultRowHeight = computed(() => globalStore.defaultRowHeight);
  const scrollState = computed(() => globalStore.scrollState);
  const stageRef = computed(() => globalStore.refs.stageRef);
  const tableRef = computed(() => globalStore.refs.tableRef);
  const horizontalScrollRef = computed(
    () => globalStore.refs.horizontalScrollRef
  );
  const verticalScrollRef = computed(() => globalStore.refs.verticalScrollRef);
  const stageContainerRef = computed(() => globalStore.refs.stageContainerRef);
  const frozenRows = computed(() => globalStore.frozenRows);
  const frozenColumns = computed(() => globalStore.frozenColumns);
  const scrollTop = computed(() => globalStore.scrollState.scrollTop);
  const scrollLeft = computed(() => globalStore.scrollState.scrollLeft);
  const columnCount = computed(() => globalStore.columnCount);
  const rowCount = computed(() => globalStore.rowCount);
  const hiddenColumns = computed(() => globalStore.hiddenColumns);
  const hiddenRows = computed(() => globalStore.hiddenRows);
  const selectedColumns = computed(() => globalStore.selectedColumns);
  const selectedRows = computed(() => globalStore.selectedRows);
  const themes = computed(() => globalStore.themes);
  const sortRowConfigs = computed(() => globalStore.sortRowConfigs);
  const filterRowsConfigs = computed(() => globalStore.filterRowsConfigs);
  const selections = computed(() => globalStore.selections);
  const activeCell = computed(() => globalStore.activeCell);

  //  columns 会根据 order 字段进行排序
  const columns = computed(() => {
    return globalStore._columns
    // return globalStore._columns.sort((left, right) => {
    //   return left.order - right.order;
    // });
  });

  const rows = computed(() => {
    return globalStore._rows
    //  现在不需要前端排序功能
    // return globalStore._rows.sort((left, right) => {
    //   return left.order - right.order;
    // });
  });

  onBeforeUnmount(() => {
    cache = null;
  });

  cache = {
    rowHeights,
    colWidths,
    columnAreaBounds,
    scrollState,
    stageRef,
    tableRef,
    stageContainerRef,
    frozenRows,
    frozenColumns,
    scrollTop,
    scrollLeft,
    columnCount,
    rowCount,
    horizontalScrollRef,
    verticalScrollRef,
    rows,
    columns,
    defaultColWidth,
    defaultRowHeight,
    rowAreaBounds,
    hiddenColumns,
    hiddenRows,
    selectedColumns,
    selectedRows,
    themes,
    sortRowConfigs,
    filterRowsConfigs,
    selections,
    activeCell,
  };

  return cache;
}
