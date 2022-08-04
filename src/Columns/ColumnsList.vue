<template>
  <section
    class="grid-columns-title-area"
    :style="{
      height: columnHeight + 'px',
    }"
    :class="{
      onTheTop: scrollState.scrollTop === 0,
      onTheLeft: scrollState.scrollLeft === 0,
    }"
  >
    <div
      class="row-header-checkbox"
      :style="{
        width: rowHeaderWidth + 'px',
      }"
    >
      <input type="checkbox" />
    </div>
    <div class="columns-scroll-box" ref="titleAreaRef">
      <div class="header-area" :style="{ width: contentWidth + 'px' }">
        <div class="columns-list">
          <div
            class="column-item"
            v-for="col in columns"
            :style="{
              width: col.width + 'px',
            }"
            :key="col.id"
          >
            <div>
              {{ col.field }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup="">
import { ref, unref, watch, watchEffect } from "vue";
import { useColumnsRender } from "@/Columns/hooks/useColumnsRender";
import { useStore } from "@/hooks/useStore";
import "./style.less";
import { useDimensions } from "@/hooks/useDimensions";

const { scrollState } = useStore();
const { rowHeaderWidth, columnHeight, contentWidth } = useDimensions();

const { columns } = useColumnsRender();

const titleAreaRef = ref<HTMLDivElement>();

watchEffect(() => {
  if (titleAreaRef.value) {
    titleAreaRef.value.scrollLeft = unref(scrollState).scrollLeft;
  }
});
</script>
