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
import { getWheelSpeed } from "$vct/Grid/hooks/utils/getWheelSpeed";

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
let mouseWheelSpeedTimeCount = 0;

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
  const { rowCount, columnCount, tableRef, rowAreaBounds, columnAreaBounds } =
    useStore();

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

    if (contentWidth === -1) {
      //  如果最后一个 right 为 -1
      //  则继续往左找
      for (let i = columnAreaBounds.length - 1; i > 0; i--) {
        const lastItem = columnAreaBounds[i];
        if (lastItem.right !== -1) {
          contentWidth = lastItem.right;
          break;
        }
      }
    }

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
      isElementContainsClassOrIsChildOf(target, ClassNameEnum.CELL_EDIT_BOX) ||
      isElementContainsClassOrIsChildOf(target, ClassNameEnum.CELL_EDIT_BOX) ||
      isElementContainsClassOrIsChildOf(target, ClassNameEnum.CELL_TOOLTIP_WRAP)
    ) {
      return;
    }

    /* If user presses shift key, scroll horizontally */
    const isScrollingHorizontally = event.shiftKey;

    /* Prevent browser back in Mac */
    event.preventDefault();
    let { deltaX, deltaY, deltaMode } = event;
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

    const speedDetail = getWheelSpeed(event);
    let isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

    //  mac 和 window 上 mousewheel 触发的频率还不一样, 这里额外做下兼容
    if (Math.abs(speedDetail.spinY) > 1) {
      mouseWheelSpeedTimeCount += 1;
      setTimeout(
        () => {
          mouseWheelSpeedTimeCount -= 1;
        },
        isMac ? 50 : 300
      );
    }

    let scrollNum = 1;

    if (Math.abs(speedDetail.spinY) > 1) {
      scrollNum =
        1 * (mouseWheelSpeedTimeCount === 1 ? 1 : mouseWheelSpeedTimeCount * 2);
    } else {
      scrollNum = Math.ceil(
        Math.abs(event.deltaY != 0 ? speedDetail.spinY : speedDetail.spinX)
      );
    }

    let isHorizontalScroll = isHorizontal;

    if (isHorizontalScroll) {
      scrollNum = scrollNum * 2;
    } else {
      scrollNum = Math.max(
        1,
        Math.floor((Math.min(25, scrollNum * 2) / 100) * unref(rowCount))
      );
    }

    if (isHorizontal) {
      if (props.horizontalScrollRef.value) {
        globalStore.scrollState.horizontalScrollDirection =
          deltaX < 0 ? Direction.Left : Direction.Right;

        const maxScrollLeft = unref(cellsMaxScrollLeft);

        //  判断左右位置
        scrollNum =
          globalStore.scrollState.horizontalScrollDirection === Direction.Right
            ? scrollNum
            : scrollNum * -1;

        //  找到当前 currentScroll 对应的 row number
        //  然后加上 scrollNum 后判断对应的 row number 中的 top 赋值给 scrollTop
        const nextColumnIndex = columnAreaBounds.value.findIndex(
          (col) => col.left > currentScroll
        );
        const currentColIndex = nextColumnIndex ? nextColumnIndex - 1 : 0;
        let newScrollLeft = 0;
        if (columnAreaBounds.value[currentColIndex + scrollNum]) {
          newScrollLeft =
            columnAreaBounds.value[currentColIndex + scrollNum].left;
        } else {
          if (scrollNum > 0) {
            newScrollLeft =
              columnAreaBounds.value[columnAreaBounds.value.length - 1].left;
          } else {
            newScrollLeft = columnAreaBounds.value[0].left;
          }
        }

        //  避免 broder 叠加
        newScrollLeft = Math.max(newScrollLeft + 1, 0);

        //  避免滚动到底部后一直滚动带来的跳动问题
        if (
          newScrollLeft + 40 > maxScrollLeft &&
          globalStore.scrollState.horizontalScrollDirection === Direction.Right
        ) {
          newScrollLeft = maxScrollLeft;
        }

        globalStore.scrollState.scrollLeft = newScrollLeft;
        props.horizontalScrollRef.value.scrollLeft = newScrollLeft;
      }
    } else {
      if (props.verticalScrollRef.value) {
        globalStore.scrollState.verticalScrollDirection =
          deltaY < 0 ? Direction.Up : Direction.Down;

        const maxScrollTop = unref(cellsMaxScrollTop);

        //  判断上下位置
        scrollNum =
          globalStore.scrollState.verticalScrollDirection === Direction.Down
            ? scrollNum
            : scrollNum * -1;

        //  找到当前 currentScroll 对应的 row number
        //  然后加上 scrollNum 后判断对应的 row number 中的 top 赋值给 scrollTop
        const nextRowIndex = rowAreaBounds.value.findIndex(
          (row) => row.top > currentScroll
        );
        const currentRowIndex = nextRowIndex ? nextRowIndex - 1 : 0;
        let newScrollTop = 0;
        if (rowAreaBounds.value[currentRowIndex + scrollNum]) {
          newScrollTop = rowAreaBounds.value[currentRowIndex + scrollNum].top;
        } else {
          if (scrollNum > 0) {
            newScrollTop =
              rowAreaBounds.value[rowAreaBounds.value.length - 1].top;
          } else {
            newScrollTop = rowAreaBounds.value[0].top;
          }
        }

        //  避免 broder 叠加
        newScrollTop = Math.max(newScrollTop + 1, 0);

        //  避免滚动到底部后一直滚动带来的跳动问题
        if (
          newScrollTop + 40 > maxScrollTop &&
          globalStore.scrollState.verticalScrollDirection === Direction.Down
        ) {
          newScrollTop = maxScrollTop;
        }

        props.verticalScrollRef.value.scrollTop = newScrollTop;
        globalStore.scrollState.scrollTop = newScrollTop;
      }
    }
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
      if (props.verticalScrollRef.value) {
        //  @ts-ignore
        props.verticalScrollRef.value.scrollTop = 0;
      }
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
