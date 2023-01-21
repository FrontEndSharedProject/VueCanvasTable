import {
  computed,
  ComputedRef,
  onBeforeUnmount,
  onMounted,
  Ref,
  unref,
  ref,
  watchEffect,
  shallowRef,
  watch,
} from "vue";
import { Direction } from "$vct/enums";
import { useGlobalStore } from "$vct/store/global";
import { useDimensions } from "$vct/hooks/useDimensions";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useStore } from "$vct/hooks/useStore";
import { isElementContainsClassOrIsChildOf } from "$vct/utils";
import { ClassNameEnum } from "$vct/enums";

export type ScrollStateType = {
  isShowScrollbarX: boolean;
  isShowScrollbarY: boolean;
  contentWidth: number;
  contentHeight: number;
  scrollTop: number;
  scrollLeft: number;
  rowStartIndex: number;
  rowStopIndex: number;
  visibleRowStartIndex: number;
  visibleRowStopIndex: number;
  visibleColumnStartIndex: number;
  visibleColumnStopIndex: number;
  columnStartIndex: number;
  columnStopIndex: number;
  isScrolling: boolean;
  verticalScrollDirection: Direction;
  horizontalScrollDirection: Direction;
};

type Props = {
  wrap: Ref<HTMLDivElement | undefined>;
  horizontalScrollRef: Ref<HTMLDivElement | undefined>;
  verticalScrollRef: Ref<HTMLDivElement | undefined>;
};

type ReturnType = {
  isOnTheTop: ComputedRef<boolean>;
  isOnTheBottom: ComputedRef<boolean>;
  isOnTheLeft: ComputedRef<boolean>;
  isOnTheRight: ComputedRef<boolean>;
  scrollState: ComputedRef<ScrollStateType>;
};

const overscanCount = 1;

export function useScroll(props: Props): ReturnType {
  const globalStore = useGlobalStore();

  const {
    getRowOffset,
    getColumnOffset,
    getColumnStartIndexForOffset,
    getColumnStopIndexForStartIndex,
    getRowStartIndexForOffset,
    getRowStopIndexForStartIndex,
  } = useExpose();
  const {
    cellsMaxScrollLeft,
    cellsMaxScrollTop,
    stageWidth,
    stageHeight,
    rowHeaderWidth,
    width,
    height,
  } = useDimensions();
  const { rowCount, columnCount, tableRef } = useStore();

  const frozenRows = computed(() => globalStore.frozenRows);
  const frozenColumns = computed(() => globalStore.frozenColumns);
  const scrollState = computed(() => globalStore.scrollState);
  const wheelingRef = shallowRef<number | null>(null);
  const isOnTheTop = computed(() => {
    return globalStore.scrollState.scrollTop === 0;
  });
  const isOnTheBottom = computed(() => {
    return (
      globalStore.scrollState.scrollTop + stageHeight.value >=
      globalStore.scrollState.contentHeight
    );
  });
  const isOnTheLeft = computed(() => {
    return globalStore.scrollState.scrollLeft === 0;
  });
  const isOnTheRight = computed(() => {
    return (
      globalStore.scrollState.scrollLeft +
        stageWidth.value -
        rowHeaderWidth.value >=
      globalStore.scrollState.contentWidth
    );
  });

  //  当 行 数量改变时判断是否需要滚动到头部
  watch(rowCount, (val) => {
    checkIfNeedScrollToLastRow();
  });

  //  当 列 数量改变时是否需要滚动到头部
  watch(columnCount, () => {
    checkIfNeedScrollToLastColumn();
  });

  watchEffect(() => {
    const scrollLeft = globalStore.scrollState.scrollLeft;
    const frozenColumnWidth = getColumnOffset(unref(frozenColumns));
    const startIndex = getColumnStartIndexForOffset(
      scrollLeft + frozenColumnWidth
    );
    const stopIndex = getColumnStopIndexForStartIndex(startIndex);

    // Overscan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    const overscanBackward =
      !globalStore.scrollState.isScrolling ||
      globalStore.scrollState.horizontalScrollDirection === Direction.Left
        ? Math.max(1, overscanCount)
        : 1;
    const overscanForward =
      !globalStore.scrollState.isScrolling ||
      globalStore.scrollState.horizontalScrollDirection === Direction.Right
        ? Math.max(1, overscanCount)
        : 1;

    globalStore.scrollState.columnStartIndex = startIndex;
    globalStore.scrollState.columnStopIndex = stopIndex;

    // globalStore.scrollState.columnStartIndex = Math.max(
    //   0,
    //   startIndex - overscanBackward
    // );
    // globalStore.scrollState.columnStopIndex = Math.max(
    //   0,
    //   Math.min(globalStore.columnCount - 1, stopIndex + overscanForward)
    // );
    // console.log(
    //   globalStore.scrollState.columnStartIndex,
    //   globalStore.scrollState.columnStopIndex
    // );
    globalStore.scrollState.visibleColumnStartIndex = startIndex;
    globalStore.scrollState.visibleColumnStopIndex = stopIndex;
  });

  watchEffect(() => {
    if (!rowCount.value) return;
    const scrollTop = globalStore.scrollState.scrollTop;
    const frozenRowHeight = getRowOffset(unref(frozenRows), true);
    const startIndex = getRowStartIndexForOffset(scrollTop + frozenRowHeight);
    const stopIndex = getRowStopIndexForStartIndex(startIndex);

    // Overscan by one item in each direction so that tab/focus works.
    // If there isn't at least one extra item, tab loops back around.
    const overscanBackward =
      !globalStore.scrollState.isScrolling ||
      globalStore.scrollState.verticalScrollDirection === Direction.Up
        ? Math.max(1, overscanCount)
        : 1;
    const overscanForward =
      !globalStore.scrollState.isScrolling ||
      globalStore.scrollState.verticalScrollDirection === Direction.Down
        ? Math.max(1, overscanCount)
        : 1;

    globalStore.scrollState.rowStartIndex = Math.max(
      0,
      startIndex - overscanBackward
    );
    globalStore.scrollState.rowStopIndex = Math.max(
      0,
      Math.min(globalStore.rowCount - 1, stopIndex + overscanForward)
    );
    globalStore.scrollState.visibleRowStartIndex = startIndex;
    globalStore.scrollState.visibleRowStopIndex = stopIndex;
  });

  watchEffect(() => {
    const columnAreaBounds = globalStore.columnAreaBounds;
    const rowAreaBounds = globalStore.rowAreaBounds;
    let contentWidth =
      columnAreaBounds.length > 0
        ? columnAreaBounds[columnAreaBounds.length - 1].right
        : 0;
    let contentHeight =
      rowAreaBounds.length > 0
        ? rowAreaBounds[rowAreaBounds.length - 1].bottom
        : 0;

    globalStore.scrollState.contentHeight = contentHeight;
    globalStore.scrollState.contentWidth = contentWidth;
    globalStore.scrollState.isShowScrollbarX =
      globalStore.scrollState.contentWidth > width.value;
    globalStore.scrollState.isShowScrollbarY =
      globalStore.scrollState.contentHeight > height.value;
  });

  onMounted(() => {
    const wrapEl = unref(props.wrap);
    if (wrapEl) {
      wrapEl.addEventListener("wheel", handleWheel, {
        passive: false,
      });
    }
  });

  onBeforeUnmount(() => {
    const wrapEl = unref(props.wrap);
    if (wrapEl) {
      wrapEl.removeEventListener("wheel", handleWheel);
    }
  });

  function handleWheel(event: WheelEvent) {
    const target = event.target as HTMLDivElement;
    if (
      isElementContainsClassOrIsChildOf(target, ClassNameEnum.CELL_EDIT_BOX)
    ) {
      return;
    }

    /* If user presses shift key, scroll horizontally */
    const isScrollingHorizontally = event.shiftKey;

    /* Prevent browser back in Mac */
    event.preventDefault();
    const { deltaX, deltaY, deltaMode } = event;
    /* Scroll natively */
    if (wheelingRef.value) return;

    let dx = isScrollingHorizontally ? deltaX : deltaY;
    let dy = deltaY;

    /* Scroll only in one direction */
    const isHorizontal = isScrollingHorizontally || Math.abs(dx) > Math.abs(dy);

    if (deltaMode === 1) {
      dy = dy * globalStore.scrollbarSize;
    }

    if (!props.horizontalScrollRef.value || !props.verticalScrollRef.value)
      return;
    const currentScroll = isHorizontal
      ? props.horizontalScrollRef.value?.scrollLeft
      : props.verticalScrollRef.value?.scrollTop;
    wheelingRef.value = window.requestAnimationFrame(() => {
      wheelingRef.value = null;
      if (isHorizontal) {
        if (props.horizontalScrollRef.value) {
          globalStore.scrollState.horizontalScrollDirection =
            deltaX < 0 ? Direction.Left : Direction.Right;

          const maxScrollLeft = unref(cellsMaxScrollLeft);

          //  这里需要避免 bouncing 效果
          let scrollLeft = Math.max(
            0,
            Math.min(currentScroll + dx, maxScrollLeft)
          );

          globalStore.scrollState.scrollLeft = scrollLeft;
          props.horizontalScrollRef.value.scrollLeft = scrollLeft;
        }
      } else {
        if (props.verticalScrollRef.value) {
          globalStore.scrollState.verticalScrollDirection =
            deltaY < 0 ? Direction.Up : Direction.Down;

          const maxScrollTop = unref(cellsMaxScrollTop);

          //  这里需要避免 bouncing 效果
          let scrollTop = Math.max(
            0,
            Math.min(currentScroll + dy, maxScrollTop)
          );

          //  避免滚动到底部后一直滚动带来的跳动问题
          if (
            scrollTop + 40 > maxScrollTop &&
            globalStore.scrollState.verticalScrollDirection === Direction.Down
          ) {
            scrollTop = maxScrollTop;
          }

          scrollTop = Math.ceil(scrollTop);

          props.verticalScrollRef.value.scrollTop = scrollTop;
          globalStore.scrollState.scrollTop = scrollTop;
        }
      }
    });
  }

  function checkIfNeedScrollToLastColumn() {
    if (
      globalStore.columnAreaBounds.length === 0 ||
      scrollState.value.scrollLeft + stageWidth.value >
        globalStore.columnAreaBounds[globalStore.columnAreaBounds.length - 1]
          .right
    ) {
      globalStore.scrollState.scrollLeft = 0;
      //  @ts-ignore
      props.horizontalScrollRef.value.scrollLeft = 0;
    }
  }

  function checkIfNeedScrollToLastRow() {
    if (
      globalStore.rowAreaBounds.length === 0 ||
      stageHeight.value >
        globalStore.rowAreaBounds[globalStore.rowAreaBounds.length - 1].bottom
    ) {
      globalStore.scrollState.scrollTop = 0;
      //  @ts-ignore
      props.verticalScrollRef.value.scrollTop = 0;
    }
  }

  return {
    isOnTheTop,
    isOnTheBottom,
    isOnTheLeft,
    isOnTheRight,
    scrollState,
  };
}
