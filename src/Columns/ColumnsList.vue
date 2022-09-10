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
      class="row-header-checkbox"
      :style="{
        width: rowHeaderWidth + 1 + 'px',
      }"
    >
      <input type="checkbox" @change="handleCheckboxChange" />
    </div>
    <div
      class="columns-scroll-box"
      :style="{ width: scrollBoxWidth }"
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
              <div>
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
const { rowHeaderWidth, columnHeight, scrollbarSize } = useDimensions();
const { columns, isSelected, isHover } = useColumnsRender();
const { selectAllRows, setRowsSelect, setSelections } = useExpose();

const VNodes = (_, { attrs }) => {
  return attrs.vnodes;
};

const titleAreaRef = ref<HTMLDivElement>();
const listWrapRef = ref<HTMLDivElement>();
const scrollBoxWidth = computed(() => {
  return `calc(100% - ${rowHeaderWidth.value}px - ${scrollbarSize.value}px)`;
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
  if (ev.target.checked) {
    selectAllRows();
  } else {
    setRowsSelect([]);
    setSelections([]);
  }
}
</script>
