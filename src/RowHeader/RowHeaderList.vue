<template>
  <div
    class="row-header-area"
    :style="{
      width: rowHeaderWidth + 'px',
      height: stageHeight + 'px',
    }"
    :class="{
      onTheLeft: scrollState.scrollLeft === 0,
      onTheTop: scrollState.scrollTop === 0,
    }"
    ref="rowHeaderRef"
  >
    <div class="row-header-content" :style="{ height: contentHeight + 'px' }">
      <div class="row-header-list">
        <div
          class="row-header-item"
          :style="{
            height: row.height + 'px',
          }"
          v-for="(row, index) in rows"
          :key="row.id"
        >
          <input type="checkbox" />
          <span class="number">{{ index + 1 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup="">
import { ref, unref, watchEffect } from "vue";
import { useStore } from "@/hooks/useStore";
import { useRowHeaderRender } from "@/RowHeader/hooks/useRowHeaderRender";
import "./style.less";
import { useDimensions } from "@/hooks/useDimensions";

const { scrollState } = useStore();
const { rowHeaderWidth, contentHeight, stageHeight } = useDimensions();
const rowHeaderRef = ref<HTMLDivElement>();

const { rows } = useRowHeaderRender();

watchEffect(() => {
  if (rowHeaderRef.value) {
    rowHeaderRef.value.scrollTop = unref(scrollState).scrollTop;
  }
});
</script>
