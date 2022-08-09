import { computed, ComputedRef, unref } from "vue";
import { useGlobalStore } from "@/store/global";
import { ScrollStateType } from "@/Grid/hooks/useScroll";
import { Column, Row } from "@/Grid/types";
import { useColumnsGroupData } from "@/hooks/useColumnsGroupData";

type ReturnType = {
  rowHeights: ComputedRef<number[]>;
  colWidths: ComputedRef<number[]>;
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
  isHiddenRow: ComputedRef<(index: number) => boolean>;
  isHiddenColumn: ComputedRef<(index: number) => boolean>;
  rows: ComputedRef<Row[]>;
  columns: ComputedRef<Column[]>;
};

let cache: ReturnType | null = null;

export function useStore(): ReturnType {
  if (cache) {
    return cache;
  }

  const globalStore = useGlobalStore();
  const { rowsData } = useColumnsGroupData();

  const rowHeights = computed(() => globalStore.rowHeights as number[]);
  const colWidths = computed(() => globalStore.colWidths as number[]);
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
  const isHiddenRow = computed(() => globalStore.isHiddenRow);
  const isHiddenColumn = computed(() => globalStore.isHiddenColumn);
  const rows = computed(() => unref(rowsData));
  const columns = computed(() => globalStore.columns);

  cache = {
    rowHeights,
    colWidths,
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
    isHiddenRow,
    isHiddenColumn,
    rows,
    columns,
  };

  return cache;
}
