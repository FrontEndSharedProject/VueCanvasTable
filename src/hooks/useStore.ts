import { computed, ComputedRef } from "vue";
import { useGlobalStore } from "@/store/global";
import { ScrollStateType } from "@/Grid/hooks/useScroll";

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
};

export function useStore(): ReturnType {
  const globalStore = useGlobalStore();

  const rowHeights = computed(() => globalStore.rowHeights as number[]);
  const colWidths = computed(() => globalStore.colWidths as number[]);
  const scrollState = computed(() => globalStore.scrollState);
  const stageRef = computed(() => globalStore.refs.stageRef);
  const tableRef = computed(() => globalStore.refs.tableRef);
  const horizontalScrollRef = computed(() => globalStore.refs.horizontalScrollRef);
  const verticalScrollRef = computed(() => globalStore.refs.verticalScrollRef);
  const stageContainerRef = computed(() => globalStore.refs.stageContainerRef);
  const frozenRows = computed(() => globalStore.frozenRows);
  const frozenColumns = computed(() => globalStore.frozenColumns);
  const scrollTop = computed(() => globalStore.scrollState.scrollTop);
  const scrollLeft = computed(() => globalStore.scrollState.scrollLeft);
  const columnCount = computed(() => globalStore.columnCount);
  const rowCount = computed(() => globalStore.rowCount);

  return {
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
    verticalScrollRef
  };
}
