<template>
  <section
    class="grid-columns-title-area"
    :style="{
      height: columnHeight + 'px',
    }"
    :class="{
      isResizing,
      isSelecting,
    }"
  >
    <div
      :class="{
        'row-header-checkbox': true,
        selected: selectedAll,
      }"
      :style="{
        width: rowHeaderWidth + 1 + 'px',
      }"
      @click="handleCheckboxChange"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 24 24"
        style="padding-top: 6px"
        v-html="selectedAll ? checkboxCheck : checkboxUnCheck"
      />
    </div>
    <div
      class="columns-scroll-box"
      :style="{ width: scrollBoxWidth + 'px' }"
      ref="titleAreaRef"
    >
      <div class="header-area">
        <div class="columns-list" ref="listWrapRef">
          <template v-for="(col, index) in columns" :key="col.id">
            <div
              class="column-item"
              :class="{
                selected: isSelected(col),
                hover: isHover(col),
                isFrozenColumn: col.isFrozenColumn,
              }"
              :style="
                styleAutoAddPx({
                  width: col.width,
                  left: col.isFrozenColumn ? col.left : 'unset',
                })
              "
              v-if="!col.hidden"
            >
              <div class="full">
                <template v-if="globalStore.columnHeaderRender">
                  <VNodes :vnodes="globalStore.columnHeaderRender(col)" />
                </template>
                <template v-else>
                  {{ col.field }}
                </template>
              </div>
              <div class="resize-grabber" @click.stop="() => {}" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
  <ResizerLine v-if="isResizing" :left="resizerLineOffsetLeft" />
  <DraggingSort v-if="isCanShowDom" :wrapRef="listWrapRef" />
</template>

<script lang="ts" setup="">
import { computed, Ref, ref, unref, watch, watchEffect } from "vue";
import { useColumnsRender } from "$vct/Columns/hooks/useColumnsRender";
import { useStore } from "$vct/hooks/useStore";
import { useDimensions } from "$vct/hooks/useDimensions";
import { useColumnsSelection } from "$vct/Columns/hooks/useColumnsSelection";
import { useColumnsResize } from "$vct/Columns/hooks/useColumnsResize";
import { styleAutoAddPx } from "$vct/utils";
import ResizerLine from "./components/ResizerLine.vue";
import DraggingSort from "./components/DraggingSort.vue";
import "./style.less";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useGlobalStore } from "$vct/store/global";

const globalStore = useGlobalStore();
const { scrollState, tableRef } = useStore();
const { rowHeaderWidth, columnHeight, scrollbarSize, stageWidth } =
  useDimensions();
const { columns, isSelected, isHover } = useColumnsRender();
const { selectAllRows, setRowsSelect, setSelections } = useExpose();
import { checkboxCheck, checkboxUnCheck } from "$vct/icons/icons";

const VNodes = (_, { attrs }) => {
  return attrs.vnodes;
};

const titleAreaRef = ref<HTMLDivElement>();
const listWrapRef = ref<HTMLDivElement>();
const selectedAll = ref<boolean>(false);
const scrollBoxWidth = computed(() => {
  return stageWidth.value - rowHeaderWidth.value;
});
const isCanShowDom = computed(() => !!listWrapRef.value);

const { isSelecting } = useColumnsSelection({
  wrap: listWrapRef as Ref<HTMLDivElement>,
});

const { isResizing, resizerLineOffsetLeft } = useColumnsResize({
  wrap: listWrapRef as Ref<HTMLDivElement>,
});

watchEffect(() => {
  if (titleAreaRef.value) {
    titleAreaRef.value.scrollLeft = unref(scrollState).scrollLeft;
  }
});

function handleCheckboxChange(ev) {
  selectedAll.value = !selectedAll.value;
  if (selectedAll.value) {
    selectAllRows();
  } else {
    setRowsSelect([]);
    setSelections([]);
  }
}
</script>

<style lang="less">
.row-header-checkbox {
  svg {
    color: var(--textColor2);
  }

  &.selected {
    svg {
      color: var(--main);
    }
  }
}
</style>
