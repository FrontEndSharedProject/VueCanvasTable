<template>
  <div
    class="frozen-bar-vertical"
    v-if="isShow"
    :style="{
      left: left + 'px',
      bottom: bottom + 'px',
    }"
  >
    <div class="handle">
      <div class="column-block"></div>
      <div
        class="line"
        :style="{
          top: columnHeight + 'px',
        }"
      ></div>
    </div>
    <div class="drop">
      <div class="column-block"></div>
      <div class="line"></div>
    </div>
  </div>
</template>

<script lang="ts" setup="">
import { useFrozenBar } from "./hooks/useFrozenBar";
import { useDimensions } from "@/hooks/useDimensions";

const { columnHeight } = useDimensions();

const { isShow, left, bottom } = useFrozenBar();
</script>

<style lang="less">
.frozen-bar-vertical {
  position: absolute;
  top: 0;
  width: 20px;
  z-index: 2;
  overflow: hidden;
  pointer-events: none;
  transform: translateX(0px);
  .handle {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 1px;
    box-shadow: 0px 0px 4px 6px rgba(0, 0, 0, 0.14);
    display: block;
    background: transparent;

    .line {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 1px;
      background: var(--lineColor);
    }
  }
}
</style>
