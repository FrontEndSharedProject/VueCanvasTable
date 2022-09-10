<template>
  <div
    v-if="isDragging"
    class="dragging-column-wrap"
    :style="styleAutoAddPx(parentStyle)"
  >
    <div
      class="grid-columns-title-area"
      :style="
        styleAutoAddPx({
          height: columnHeight,
        })
      "
    >
      <div class="columns-list">
        <template v-for="column in columnsArr" :key="column.id">
          <div
            class="column-item"
            :style="
              styleAutoAddPx({
                width: column.width,
              })
            "
          >
            {{ column.field }}
          </div>
        </template>
      </div>
    </div>
  </div>
  <div
    v-if="isDragging && insertLineLeft >= 0"
    :style="
      styleAutoAddPx({
        left: insertLineLeft,
        top: columnHeight,
        bottom: scrollbarSize,
      })
    "
    class="sort-insert-line"
  />
</template>

<script lang="ts" setup="">
import { useColumnDragSort } from "$vct/Columns/hooks/useColumnDragSort";
import { computed, Ref } from "vue";
import { styleAutoAddPx } from "$vct/utils";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useStore } from "$vct/hooks/useStore";
import { useDimensions } from "$vct/hooks/useDimensions";

type Props = {
  wrapRef: HTMLDivElement;
};
const props = withDefaults(defineProps<Props>(), {});
const { getColumnWidth } = useExpose();
const { columns } = useStore();
const { scrollbarSize, columnHeight } = useDimensions();
const { offsetLeft, isDragging, draggingColumnIndexs, insertLineLeft } =
  useColumnDragSort({
    wrap: props.wrapRef,
  });

const columnsArr = computed(() => {
  return draggingColumnIndexs.value.map((index) => {
    return columns.value[index];
  });
});
const parentStyle = computed(() => {
  return {
    left: offsetLeft.value,
    bottom: scrollbarSize.value,
  };
});
</script>

<style lang="less">
.dragging-column-wrap {
  position: absolute;
  top: 0;
  background: rgba(#000, 0.3);
  color: #fff;
  z-index: 9999;
  opacity: 0.8;

  .columns-list {
    padding-right: 0 !important;
    border-right: none;

    .column-item {
      background: var(--columnHeaderBackgroundDrag) !important;
      &:last-of-type {
        border-right: none !important;
      }
    }
  }
}

.sort-insert-line {
  position: absolute;
  top: 0;
  border-right: 0;
  width: 4px;
  background: var(--textColor2);
  transform: translateX(-2px);
  z-index: 9999;
}
</style>
