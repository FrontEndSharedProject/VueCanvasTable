<template>
  <div
    :style="boxStyle"
    class="cell-editor-box"
    :class="{ isHaveDataVerificationError }"
    ref="boxRef"
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
        :changeParentStyle="changeParentStyle"
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
        :changeParentStyle="changeParentStyle"
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
import {
  computed,
  onMounted,
  ref,
  toRaw,
  nextTick,
  watchEffect,
  reactive,
} from "vue";
import { AutoSizerCanvas, castToString } from "$vct/helpers";
import { styleAutoAddPx } from "$vct/utils";
import { useDataVerification } from "$vct/Grid/hooks/useDataVerification";
import DefaultCellEditor from "./DefaultCellEditor.vue";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useStore } from "$vct/hooks/useStore";
import { useRefs } from "$vct/Grid/hooks/useRefs";

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
const { themes } = useStore();
const boxRef = ref();
const { tableRef } = useRefs();

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

const boxStyle = reactive({
  top: y + "px",
  left: x + "px",
  position: "absolute",
  minWidth: props.renderProps.width + 4 + "px",
  minHeight: props.renderProps.height + 4 + "px",
  "z-index": 12,
  background: "#fff",
  border: `2px solid ${themes.value.main}`,
  "border-radius": "2px",
  "box-shadow": "0px 12px 20px 6px rgba(38, 47, 77, 0.2)",
  right: "unset",
});

onMounted(() => {
  column.dataVerification && onUpdateForDataVerification(value);

  //  修改下边界右侧溢出问题
  if (tableRef.value && boxRef.value) {
    const left = tableRef.value.getBoundingClientRect().left;
    const width = boxRef.value.getBoundingClientRect().width;
    if (left + parseInt(boxStyle.left) + width > window.innerWidth) {
      boxStyle.left = "unset";
      boxStyle.right = "0px";
    }
  }
});

function changeParentStyle(cssObj) {
  Object.assign(boxStyle, cssObj);
}

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
  &.isHaveDataVerificationError {
    border-color: var(--dangerColor);
  }
  &:has(.error-message-box) {
    border-color: var(--dangerColor) !important;
  }
}
</style>
