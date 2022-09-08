<template>
  <div :style="boxStyle" class="cell-editor-box">
    <template v-if="customEditor">
      <customEditor
        @updateForDataVerification="onUpdateForDataVerification"
        :renderProps="renderProps"
        :haveError="isHaveDataVerificationError"
      />
    </template>
    <template v-else>
      <DefaultCellEditor
        @updateForDataVerification="onUpdateForDataVerification"
        :renderProps="renderProps"
        :haveError="isHaveDataVerificationError"
      />
    </template>

    <div class="error-message-box" v-if="isHaveDataVerificationError">
      <p v-for="msg in dataVerificationError" :key="msg">
        <span class="error">验证错误:</span>
        <span>{{ msg }}</span>
      </p>
    </div>
  </div>
</template>

<script lang="tsx" setup="">
import { CellEditorProps } from "@/types";
import { computed, onMounted, ref, toRaw, nextTick, watchEffect } from "vue";
import { AutoSizerCanvas, castToString } from "@/helpers";
import { styleAutoAddPx } from "@/utils";
import { useDataVerification } from "@/Grid/hooks/useDataVerification";
import DefaultCellEditor from "./DefaultCellEditor.vue";
import { useExpose } from "@/Grid/hooks/useExpose";

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

const boxStyle = computed(() => {
  return styleAutoAddPx({
    top: y - borderWidth / 2,
    left: x,
    position: "absolute",
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
  background: rgb(255, 255, 255);
  padding: 6px 12px 0px;
  box-shadow: rgb(50 50 93 / 25%) 0px 6px 12px -2px,
    rgb(0 0 0 / 30%) 0px 3px 7px -3px;
  border-radius: 2px;
  border: 1px solid rgb(204, 204, 204);
  z-index: 11;
  font-size: 14px;
  user-select: auto;
  left: 0;
  bottom: 0;
  opacity: 1;
  pointer-events: none;
  transform: translateY(100%);

  p {
    font-size: 12px;
    margin-top: 0;
    margin-bottom: 6px;
    white-space: nowrap;
  }

  .error {
    color: #f20;
  }
}

.cell-editor-box {
  z-index: 9;
}
</style>