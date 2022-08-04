import { onBeforeUnmount, onMounted, Ref } from "vue";
import { useStore } from "@/hooks/useStore";
import { throttle } from "lodash-es";
import { useDimensions } from "@/hooks/useDimensions";
import { useGlobalStore } from "@/store/global";
import { useExpose } from "@/Grid/hooks/useExpose";

/**
 * 鼠标点击拖拽到边缘时自动滚动
 */

type Props = {
  wrap: Ref<HTMLDivElement | undefined>;
};
export function useDragOnEdgeScroll(props: Props) {
  const globalStore = useGlobalStore();
  const { tableRef } = useStore();
  const { scrollTo } = useExpose();
  const { columnHeight, cellsMaxScrollLeft, cellsMaxScrollTop } =
    useDimensions();

  let mouseMoveRef: any = null;
  let isMouseDown: boolean = false;

  onMounted(() => {
    if (props.wrap.value) {
      props.wrap.value?.addEventListener("mousedown", handleMouseDown);
    }
  });

  onBeforeUnmount(() => {
    if (props.wrap.value) {
      props.wrap.value?.removeEventListener("mousedown", handleMouseDown);
    }
  });

  function handleMouseDown(e: MouseEvent) {
    if (e.buttons !== 1) return;
    isMouseDown = true;

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
  }

  const autoScrollDetection = throttle(_autoScrollDetection, 300);
  function handleMouseMove(e: MouseEvent) {
    if (!isMouseDown) return;
    if (mouseMoveRef) return;

    mouseMoveRef = window.requestAnimationFrame(() => {
      mouseMoveRef = null;
      if (!tableRef.value) return;

      autoScrollDetection(e);
    });
  }

  function handleMouseUp() {
    isMouseDown = false;
  }

  function _autoScrollDetection(e: MouseEvent) {
    if (!tableRef.value) return;
    const { left, top, width, height } = tableRef.value.getBoundingClientRect();

    //  定义鼠标超出下面那个 bounds 才需要自动滚动
    let offset: number = 120;
    let leftBound: number = left + offset;
    let rightBound: number = left + width - offset;
    let topBound: number = top + offset + columnHeight.value;
    let bottomBound: number = top + height - offset;

    let clientX = e.clientX;
    let clientY = e.clientY;

    //  向左滚动
    if (clientX < leftBound) {
      let scrollLeft =
        0 < globalStore.scrollState.scrollLeft - offset
          ? globalStore.scrollState.scrollLeft - offset
          : 0;

      scrollTo({
        scrollLeft: scrollLeft,
      });
    }

    //  向右滚动
    if (clientX > rightBound) {
      let scrollLeft =
        globalStore.scrollState.scrollLeft < cellsMaxScrollLeft.value - offset
          ? globalStore.scrollState.scrollLeft + offset
          : cellsMaxScrollLeft.value;

      scrollTo({
        scrollLeft: scrollLeft,
      });
    }

    //  向上滚动
    if (clientY < topBound) {
      let scrollTop =
        0 < globalStore.scrollState.scrollTop - offset
          ? globalStore.scrollState.scrollTop - offset
          : 0;

      scrollTo({
        scrollTop: scrollTop,
      });
    }

    //  向下滚动
    if (clientY > bottomBound) {
      let scrollTop =
        globalStore.scrollState.scrollTop < cellsMaxScrollTop.value - offset
          ? globalStore.scrollState.scrollTop + offset
          : cellsMaxScrollTop.value;

      scrollTo({
        scrollTop: scrollTop,
      });
    }
  }
}
