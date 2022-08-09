/**
 * 该 hook 主要处理各种区域的宽度，高度
 */
import { computed, ComputedRef, unref } from "vue";
import { useGlobalStore } from "@/store/global";
import { useHelpers } from "@/hooks/useHelpers";

type ReturnType = {
  //  cells 渲染区域宽度
  stageWidth: ComputedRef<number>;
  //  cells 渲染区域高度
  stageHeight: ComputedRef<number>;
  //  columns 高度
  columnHeight: ComputedRef<number>;
  //  rows 左侧序号宽度
  rowHeaderWidth: ComputedRef<number>;
  //  滚动条宽度
  scrollbarSize: ComputedRef<number>;
  //  cells 内容宽度
  contentHeight: ComputedRef<number>;
  //  cells 内容宽度
  contentWidth: ComputedRef<number>;
  //  cells 区域裁切宽度
  cellsAreaClipWidth: ComputedRef<number>;
  //  cells 区域裁切高度
  cellsAreaClipHeight: ComputedRef<number>;
  //  冻结 column 宽度
  frozenColumnWidth: ComputedRef<number>;
  //  冻结 rows 高度
  frozenRowHeight: ComputedRef<number>;
  //  最大的 scrollLeft 值，如果超过则会出现空白的问题
  cellsMaxScrollLeft: ComputedRef<number>;
  //  最大的 scrollTop 值，如果超过则会出现空白的问题
  cellsMaxScrollTop: ComputedRef<number>;
};

export function useDimensions(): ReturnType {
  const globalStore = useGlobalStore();

  const { getColumnOffset, getRowOffset } = useHelpers();

  const width = computed(() => globalStore.width);
  const height = computed(() => globalStore.height);
  const rowHeaderWidth = computed(() => globalStore.rowHeaderWidth);
  const columnHeight = computed(() => globalStore.columnHeight);
  const scrollbarSize = computed(() => globalStore.scrollbarSize);
  const contentHeight = computed(() => globalStore.scrollState.contentHeight);
  const contentWidth = computed(() => globalStore.scrollState.contentWidth);
  const frozenColumnWidth = computed(() =>
    getColumnOffset(globalStore.frozenColumns)
  );
  const frozenRowHeight = computed(() => getRowOffset(globalStore.frozenRows));

  const stageWidth = computed(() => {
    return unref(width);
  });
  const stageHeight = computed(() => {
    return unref(height) - unref(columnHeight);
  });

  const cellsAreaClipWidth = computed(
    () => unref(stageWidth) - unref(frozenColumnWidth)
  );
  const cellsAreaClipHeight = computed(
    () => unref(stageHeight) - unref(frozenRowHeight)
  );

  const cellsMaxScrollLeft = computed(() => {
    return unref(contentWidth) - unref(stageWidth) + unref(scrollbarSize) + 1;
  });

  const cellsMaxScrollTop = computed(() => {
    return unref(contentHeight) - unref(stageHeight) + unref(scrollbarSize) + 1;
  });

  return {
    stageWidth,
    stageHeight,
    columnHeight,
    rowHeaderWidth,
    scrollbarSize,
    contentHeight,
    contentWidth,
    frozenColumnWidth,
    frozenRowHeight,
    cellsAreaClipWidth,
    cellsAreaClipHeight,
    cellsMaxScrollLeft,
    cellsMaxScrollTop,
  };
}
