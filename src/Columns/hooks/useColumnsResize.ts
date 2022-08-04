import { onBeforeUnmount, onMounted, ref, Ref } from "vue";
import { useExpose } from "@/Grid/hooks/useExpose";
import { useDimensions } from "@/hooks/useDimensions";
import { useStore } from "@/hooks/useStore";
import { useGlobalStore } from "@/store/global";

/**
 * column 调整宽度
 */

type Props = {
  wrap: Ref<HTMLDivElement>;
};

type ReturnType = {
  isResizing: Ref<boolean>;
  resizerLineOffsetLeft: Ref<number>;
};

export function useColumnsResize(props: Props): ReturnType {
  const isResizing = ref(false);
  const resizerLineOffsetLeft = ref<number>(0);
  let startDragX: number = 0;
  let startOffsetLeft: number = 0;
  let startScrollLeft: number = 0;
  let minimum: number = 40;
  let minimumOffsetLeft: number = 0;
  let maximumOffsetLeft: number = 0;
  let targetColumnOffsetLeft: number = 0;
  let endOffsetLeft: number = 0;
  let endScrollLeft: number = 0;
  let columnIndex: number = 0;
  let mouseMoveRef: any = null;

  const globalStore = useGlobalStore();
  const {
    getCellCoordsFromOffset,
    getRelativePositionFromOffset,
    setColumnsWidthByIndex,
    getColumnWidth,
    getColumnOffset,
  } = useExpose();
  const { rowHeaderWidth, scrollbarSize } = useDimensions();
  const { tableRef, scrollState } = useStore();

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
    const target = e.target as HTMLDivElement;
    if (e.buttons !== 1) return;
    if (!target.classList.contains("resize-grabber")) return;
    if (!props.wrap.value) return;
    if (!tableRef.value) return;

    const { x: handlerX, width: handlerWidth } = target.getBoundingClientRect();
    const { x: tableX, width: tableWidth } =
      tableRef.value.getBoundingClientRect();
    const clientX = handlerX + handlerWidth / 2;

    const coords = getCellCoordsFromOffset(clientX - 20, e.clientY);
    const pos = getRelativePositionFromOffset(clientX, e.clientY);
    if (!pos) return;
    let { x } = pos;

    x += rowHeaderWidth.value;

    if (!coords) {
      return;
    }

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);

    isResizing.value = true;
    startDragX = e.clientX;
    startOffsetLeft = x;
    startScrollLeft = scrollState.value.scrollLeft;
    resizerLineOffsetLeft.value = x;
    targetColumnOffsetLeft = getColumnOffset(coords.columnIndex);
    // minimumOffsetLeft = x - getColumnWidth(coords.columnIndex) + minimum;
    maximumOffsetLeft =
      tableX + tableWidth - (e.clientX - x) - scrollbarSize.value;
    columnIndex = coords.columnIndex;
  }

  function handleMouseMove(e: MouseEvent) {
    if (mouseMoveRef) return;
    if (!isResizing.value) return;
    mouseMoveRef = window.requestAnimationFrame(() => {
      mouseMoveRef = null;

      const newOffsetLeft = startOffsetLeft + (e.clientX - startDragX);

      minimumOffsetLeft =
        targetColumnOffsetLeft -
        scrollState.value.scrollLeft +
        rowHeaderWidth.value +
        minimum;

      if (newOffsetLeft < minimumOffsetLeft) return;
      if (newOffsetLeft > maximumOffsetLeft) return;

      endOffsetLeft = newOffsetLeft;
      endScrollLeft = scrollState.value.scrollLeft;
      resizerLineOffsetLeft.value = newOffsetLeft;
    });
  }

  function handleMouseUp() {
    isResizing.value = false;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    let diffWidth =
      endOffsetLeft - startOffsetLeft + (endScrollLeft - startScrollLeft);
    const oldWidth = getColumnWidth(columnIndex);
    const newWidth = oldWidth + diffWidth;

    let config: Record<string, number> = {};

    if (
      globalStore.selectedColumns.length > 0 &&
      globalStore.selectedColumns.includes(columnIndex)
    ) {
      globalStore.selectedColumns.map((colIndex) => {
        config[colIndex] = newWidth;
      });
    } else {
      config[columnIndex] = newWidth;
    }

    setColumnsWidthByIndex(config);
  }

  return {
    isResizing,
    resizerLineOffsetLeft: resizerLineOffsetLeft,
  };
}
