/**
 * 该 hook 主要处理各种区域的宽度，高度
 */
import {
  computed,
  ComputedRef,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  unref,
  watch,
} from "vue";
import { useGlobalStore } from "$vct/store/global";
import { useStore } from "$vct/hooks/useStore";
import { debounce } from "lodash-es";

type ReturnType = {
  //  rootEl 宽度
  width: ComputedRef<number>;
  //  rootEl 高度
  height: ComputedRef<number>;
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
  //  冻结列 区域裁切宽度
  frozenAreaClipWidth: ComputedRef<number>;
  //  冻结列 区域裁切高度
  frozenAreaClipHeight: ComputedRef<number>;
  //  冻结 column 宽度
  frozenColumnWidth: ComputedRef<number>;
  //  冻结 rows 高度
  frozenRowHeight: ComputedRef<number>;
  //  最大的 scrollLeft 值，如果超过则会出现空白的问题
  cellsMaxScrollLeft: ComputedRef<number>;
  //  最大的 scrollTop 值，如果超过则会出现空白的问题
  cellsMaxScrollTop: ComputedRef<number>;
  //  x 轴 scrollbar 宽度
  horizonScrollBarWidth: ComputedRef<number>;
  //  y 轴 scrollbar 高度
  verticalScrollBarWidth: ComputedRef<number>;
  //  竖 滚动条宽度，自适应
  scrollbarYWidthHack: ComputedRef<number>;
  //  横 滚动条高度，自适应
  scrollbarXHeightHack: ComputedRef<number>;
  //  底部添加新行高度
  addNewRowHeight: ComputedRef<number>;
};

let cache: ReturnType | null = null;

export function useDimensions(): ReturnType {
  if (cache) return cache;

  const globalStore = useGlobalStore();
  const { tableRef, rowAreaBounds, columnAreaBounds, scrollState } = useStore();

  const autoWidth = ref<number>(0);
  const autoHeight = ref<number>(0);
  const width = computed(() => autoWidth.value);
  const height = computed(() => autoHeight.value);
  const rowHeaderWidth = computed(() => globalStore.rowHeaderWidth);
  const columnHeight = computed(() => globalStore.columnHeight);
  const scrollbarSize = computed(() => globalStore.scrollbarSize);
  const contentHeight = computed(
    () => globalStore.scrollState.contentHeight + addNewRowHeight.value
  );
  const contentWidth = computed(() => globalStore.scrollState.contentWidth);
  const frozenColumnWidth = computed(() =>
    globalStore.columnAreaBounds[globalStore.frozenColumns]
      ? globalStore.columnAreaBounds[globalStore.frozenColumns].left
      : 0
  );
  const frozenRowHeight = computed(
    // () => globalStore.rowAreaBounds[globalStore.frozenRows].top
    () => 0
  );
  const addNewRowHeight = computed(() => globalStore.addNewRowHeight);

  const scrollbarYWidthHack = computed(() => {
    return scrollState.value.isShowScrollbarY ? scrollbarSize.value : 0;
  });
  const scrollbarXHeightHack = computed(() => {
    return scrollState.value.isShowScrollbarX ? scrollbarSize.value : 0;
  });

  const stageWidth = computed(() => {
    return unref(width) - scrollbarYWidthHack.value;
  });
  const stageHeight = computed(() => {
    return unref(height) - unref(columnHeight) - scrollbarXHeightHack.value;
  });

  const cellsAreaClipWidth = computed(
    () => unref(stageWidth) - unref(frozenColumnWidth)
  );
  const cellsAreaClipHeight = computed(
    () => unref(stageHeight) - unref(frozenRowHeight)
  );
  const frozenAreaClipWidth = computed(
    () => unref(frozenColumnWidth) + rowHeaderWidth.value
  );
  const frozenAreaClipHeight = computed(
    () => unref(stageHeight) - unref(frozenRowHeight)
  );

  const cellsMaxScrollLeft = computed(() => {
    return unref(contentWidth) - unref(stageWidth) + unref(rowHeaderWidth) + 1;
  });

  const cellsMaxScrollTop = computed(() => {
    let maxHeight = unref(contentHeight) - unref(stageHeight);

    return Math.max(maxHeight, 0);
  });

  const horizonScrollBarWidth = computed(() => {
    return unref(stageWidth) - unref(rowHeaderWidth);
  });

  const verticalScrollBarWidth = computed(() => {
    return unref(stageHeight);
  });
  const _resize = debounce(resize, 0);

  onMounted(() => {
    window.addEventListener("resize", _resize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", _resize);
  });

  watch(
    tableRef,
    (rootEl) => {
      if (rootEl) {
        resize();
      }
    },
    {
      immediate: true,
    }
  );

  watch(
    () => [columnAreaBounds, rowAreaBounds],
    () => {
      _resize();
    },
    {
      deep: true,
    }
  );

  function resize() {
    console.log('resize')
    if (!tableRef.value) return;
    const parentEl = tableRef.value.parentElement as HTMLDivElement;
    const { width: pWidth, height: pHeight } = parentEl.getBoundingClientRect();
    let [width, height] = [pWidth, pHeight];

    //  height 贴合
    //  判断是否需要贴合到最后一个 row
    if (rowAreaBounds.value.length > 0) {
      const lastRowBottom =
        rowAreaBounds.value[rowAreaBounds.value.length - 1].bottom;
      if (lastRowBottom < height) {
        height =
          lastRowBottom +
          addNewRowHeight.value +
          columnHeight.value +
          scrollbarXHeightHack.value;
      }
    } else {
      height = columnHeight.value + addNewRowHeight.value;
    }

    //  width 贴合
    //  判断是否需要贴合到最后一个 column
    if (columnAreaBounds.value.length > 0) {
      let lastColumnRight =
        columnAreaBounds.value[columnAreaBounds.value.length - 1].right;

      if (lastColumnRight === -1) {
        //  如果最后一个 right 为 -1
        //  则继续往左找
        for (let i = columnAreaBounds.value.length - 1; i > 0; i--) {
          const lastItem = columnAreaBounds.value[i];
          if (lastItem.right !== -1) {
            lastColumnRight = lastItem.right;
            break;
          }
        }
      }

      if (lastColumnRight < width) {
        width =
          lastColumnRight +
          rowHeaderWidth.value +
          scrollbarYWidthHack.value +
          1;
      }
    } else {
      throw new Error("column 不能为 0");
    }

    autoWidth.value = Math.min(width, pWidth);
    autoHeight.value = Math.min(height, pHeight);
  }

  onBeforeUnmount(() => {
    cache = null;
  });

  cache = {
    width,
    height,
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
    frozenAreaClipWidth,
    frozenAreaClipHeight,
    cellsMaxScrollLeft,
    cellsMaxScrollTop,
    horizonScrollBarWidth,
    verticalScrollBarWidth,
    scrollbarYWidthHack,
    scrollbarXHeightHack,
    addNewRowHeight,
  };

  return cache;
}
