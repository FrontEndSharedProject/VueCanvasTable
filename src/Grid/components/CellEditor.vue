<template>
  <div
    :style="boxStyle"
    class="cell-editor-box"
    :class="{ isHaveDataVerificationError }"
  >
    <template v-if="customEditor">
      <customEditor
        @updateForDataVerification="onUpdateForDataVerification"
        :renderProps="renderProps"
        :columnsOptions="columnsOptions"
        :haveError="isHaveDataVerificationError"
        :value="renderProps.value"
        :finishEdit="renderProps.onSubmit"
        :update="renderProps.onChange"
        :stopEditing="renderProps.onCancel"
      />
    </template>
    <template v-else>
      <DefaultCellEditor
        @updateForDataVerification="onUpdateForDataVerification"
        :renderProps="renderProps"
        :columnsOptions="columnsOptions"
        :haveError="isHaveDataVerificationError"
        :value="renderProps.value"
        :finishEdit="renderProps.onSubmit"
        :update="renderProps.onChange"
        :stopEditing="renderProps.onCancel"
      />
    </template>

    <div class="error-message-box" v-if="isHaveDataVerificationError">
      <p v-for="msg in dataVerificationError" :key="msg">
        <span>{{ msg }}</span>
      </p>
    </div>
  </div>
</template>

<script lang="tsx" setup="">
import { CellEditorProps } from "$vct/types";
import { computed, onMounted, ref, toRaw, nextTick, watchEffect } from "vue";
import { AutoSizerCanvas, castToString } from "$vct/helpers";
import { styleAutoAddPx } from "$vct/utils";
import { useDataVerification } from "$vct/Grid/hooks/useDataVerification";
import DefaultCellEditor from "./DefaultCellEditor.vue";
import { useExpose } from "$vct/Grid/hooks/useExpose";

type Props = {
  renderProps: CellEditorProps;
};
const props = withDefaults(defineProps<Props>(), {});

const {
  position,
  cell,
  value = "",
  activeCell,
  autoFocus = true,
} = props.renderProps;

const { getColumnByColIndex } = useExpose();
const { verify } = useDataVerification();

const borderWidth = 2;
const column = getColumnByColIndex(activeCell.columnIndex);
const dataVerificationError = ref<string[]>([]);
const isHaveDataVerificationError = computed(
  () => dataVerificationError.value.length > 0
);
const customEditor = toRaw(column.cellEditor ? column.cellEditor : null);
const { x = 0, y = 0, width = 0, height = 0 } = computed(() => position).value;
const columnsOptions = computed(() => {
  return props.renderProps.column?.properties;
});

const boxStyle = computed(() => {
  return styleAutoAddPx({
    top: y,
    left: x,
    position: "absolute",
    minWidth: props.renderProps.width + 4,
    minHeight: props.renderProps.height + 4,
  });
});

onMounted(() => {
  column.dataVerification && onUpdateForDataVerification(value);
});

function onUpdateForDataVerification(value: string) {
  if (column.dataVerification) {
    const res = verify(value, column.dataVerification);
    dataVerificationError.value = res ? res : [];
  }
}
</script>

<style lang="less">
.error-message-box {
  position: absolute;
  background: var(--dangerColor);
  padding: 6px 12px 0px;
  box-shadow: rgb(50 50 93 / 25%) 0px 6px 12px -2px,
    rgb(0 0 0 / 30%) 0px 3px 7px -3px;
  border-radius: 2px;
  border: 1px solid var(--dangerColor);
  z-index: 11;
  font-size: 14px;
  user-select: auto;
  left: -2px;
  bottom: 0;
  opacity: 1;
  pointer-events: none;
  transform: translateY(100%);

  p {
    font-size: 12px;
    margin-top: 0;
    margin-bottom: 6px;
    white-space: nowrap;
    color: #fff;
  }
}

.cell-editor-box {
  z-index: 9;
  background: #fff;
  border: 2px solid var(--main);
  border-radius: 2px;
  box-shadow: 0px 12px 20px 6px rgba(38, 47, 77, 0.2);

  &.isHaveDataVerificationError {
    border-color: var(--dangerColor);
  }
}
</style>
