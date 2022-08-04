<template>
  <!--  滚动条  -->
  <div
    class="grid-scrollbar grid-scrollbar-y"
    v-if="scrollState.isShowScrollbarY"
    :style="{
      height: verticalScrollBarWidth + 'px',
      top: columnHeightReactive + 'px',
    }"
    ref="verticalScrollRef"
    @scroll="handleScrollY"
  >
    <div :style="{ height: contentHeight + 'px' }"></div>
  </div>
  <div
    class="grid-scrollbar grid-scrollbar-x"
    v-if="scrollState.isShowScrollbarX"
    :style="{
      width: horizonScrollBarWidth + 'px',
      left: rowHeaderWidthReactive + 'px',
    }"
    ref="horizontalScrollRef"
    @scroll="handleScrollX"
  >
    <div :style="{ width: contentWidth + 'px' }"></div>
  </div>
</template>

<script lang="ts" setup="">
import { useStore } from "@/hooks/useStore";
import { useDimensions } from "@/hooks/useDimensions";
import { ref } from "vue";
import { useGlobalStore } from "@/store/global";
import { Direction } from "@/enums";
import { debounce } from "lodash-es";

const globalStore = useGlobalStore();
const { scrollState } = useStore();
const horizontalScrollRef = ref<HTMLDivElement>();
const verticalScrollRef = ref<HTMLDivElement>();

const {
  horizonScrollBarWidth,
  verticalScrollBarWidth,
  rowHeaderWidth: rowHeaderWidthReactive,
  columnHeight: columnHeightReactive,
  contentHeight,
  contentWidth,
} = useDimensions();

const cancelScrolling = debounce(_cancelScrolling, 150);

function handleScrollX(e) {
  const { scrollLeft } = e.target;

  if (globalStore.scrollState.scrollLeft === scrollLeft) {
    return;
  }

  globalStore.scrollState.isScrolling = true;
  globalStore.scrollState.horizontalScrollDirection =
    globalStore.scrollState.scrollLeft > scrollLeft
      ? Direction.Left
      : Direction.Right;

  globalStore.scrollState.scrollLeft = scrollLeft;

  cancelScrolling();
}

function handleScrollY(e) {
  const { scrollTop } = e.target;

  if (globalStore.scrollState.scrollTop === scrollTop) {
    return;
  }

  globalStore.scrollState.isScrolling = true;
  globalStore.scrollState.verticalScrollDirection =
    globalStore.scrollState.scrollTop > scrollTop
      ? Direction.Up
      : Direction.Down;

  globalStore.scrollState.scrollTop = scrollTop;

  cancelScrolling();
}

function _cancelScrolling() {
  globalStore.scrollState.isScrolling = false;
}

defineExpose({ horizontalScrollRef, verticalScrollRef });
</script>

<style lang="less">
.grid-scrollbar {
  overflow: scroll;
  position: absolute;

  &:hover {
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    &::-webkit-scrollbar-track{
      box-shadow: none;
    }
  }
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
    border-radius: 0;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--scrollbarThumbBackground);
    border-radius: 4px;
    box-shadow: none;
    background-clip: content-box;
    border: 1px solid transparent;
    display: block;
  }
  &::-webkit-scrollbar-track {
    box-shadow: inset 1px 1px 4px rgba(38, 47, 77, 0.12);
  }
  &.grid-scrollbar-y {
    overflow-x: hidden;
    right: 0;
    width: 24px;
    div {
      position: absolute;
      width: 1px;
    }
  }
  &.grid-scrollbar-x {
    overflow-y: hidden;
    bottom: 0;
    left: 0;
    height: 13px;
    div {
      position: absolute;
      height: 1px;
    }
  }
}
</style>
