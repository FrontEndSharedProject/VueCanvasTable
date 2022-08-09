import {
  computed,
  ComputedRef,
  onBeforeUnmount,
  onMounted,
  Ref,
  unref,
  ref,
  watchEffect,
} from "vue";
import { sum, throttle, cloneDeep } from "lodash-es";
import { Direction } from "@/enums";
import { useGlobalStore } from "@/store/global";
import {
  getColumnStartIndexForOffset,
  getColumnStopIndexForStartIndex,
  getRowStartIndexForOffset,
  getRowStopIndexForStartIndex,
} from "@/helpers";
import { useHelpers } from "@/hooks/useHelpers";
import { useDimensions } from "@/hooks/useDimensions";

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

const overscanCount = 1;

export function useScroll(props: Props): {
  scrollState: ComputedRef<ScrollStateType>;
} {
  const globalStore = useGlobalStore();

  const { getRowOffset, getColumnOffset, getRowHeight, getColumnWidth } =
    useHelpers();
  const { cellsMaxScrollLeft, cellsMaxScrollTop } = useDimensions();

  const frozenRows = computed(() => globalStore.frozenRows);
  const frozenColumns = computed(() => globalStore.frozenColumns);
  const scrollState = computed(() => globalStore.scrollState);
  const wheelingRef = ref<number | null>(null);

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

    globalStore.scrollState.columnStartIndex = Math.max(
      0,
      startIndex - overscanBackward
    );
    globalStore.scrollState.columnStopIndex = Math.max(
      0,
      Math.min(globalStore.columnCount - 1, stopIndex + overscanForward)
    );
    globalStore.scrollState.visibleColumnStartIndex = startIndex;
    globalStore.scrollState.visibleColumnStopIndex = stopIndex;
  });

  watchEffect(() => {
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
    globalStore.scrollState.contentHeight = sum(
      globalStore.rowHeights as number[]
    );
    globalStore.scrollState.contentWidth = sum(
      globalStore.colWidths as number[]
    );
    globalStore.scrollState.isShowScrollbarX =
      globalStore.scrollState.contentWidth > globalStore.width;
    globalStore.scrollState.isShowScrollbarY =
      globalStore.scrollState.contentHeight > globalStore.height;
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

          scrollLeft = Math.ceil(scrollLeft);

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

  return {
    scrollState,
  };
}
