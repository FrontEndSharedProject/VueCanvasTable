<template>
  <div :style="textAreaBoxStyle">
    <textarea
      :rows="1"
      :cols="1"
      ref="inputRef"
      :value="defaultValue"
      :style="textAreaStyle"
      @change="handleTextAreaChange"
      @keydown="handleTextAreaKeydown"
      @input="handleTextAreaInput"
    />
  </div>
</template>

<script lang="ts" setup="">
import { computed, ref, watchEffect } from "vue";
import { styleAutoAddPx } from "@/utils";
import { CellEditorProps } from "@/types";
import { Direction, KeyCodes } from "@/enums";
import { castToString } from "@/helpers";

type Props = {
  renderProps: CellEditorProps;
};
const props = withDefaults(defineProps<Props>(), {});
const emits = defineEmits<{
  (e: "updateForDataVerification", value: string): void;
}>();

const borderWidth = 2;
const padding = 10; /* 2 + 1 + 1 + 2 + 2 */
const inputRef = ref<HTMLTextAreaElement | null>(null);

const {
  onChange,
  onSubmit,
  onCancel,
  position,
  cell,
  width,
  height,
  nextFocusableCell,
  value = "",
  activeCell,
  autoFocus = true,
  onKeyDown,
  selections,
  scrollPosition,
  maxWidth,
  maxHeight,
  isFrozenRow,
  isFrozenColumn,
  frozenRowOffset,
  frozenColumnOffset,
  ...rest
} = props.renderProps;

const defaultValue = ref(value);

const textAreaBoxStyle = computed(() => {
  return styleAutoAddPx({
    width: width,
    height: height + borderWidth,
    padding: borderWidth,
    boxShadow: "0 2px 6px 2px rgba(60,64,67,.15)",
    border: "2px #1a73e8 solid",
    background: "white",
  });
});

const textAreaStyle = computed(() => {
  return styleAutoAddPx({
    font: "12px Arial",
    lineHeight: 1.2,
    width: "100%",
    height: "100%",
    padding: "0 1px",
    margin: 0,
    boxSizing: "border-box",
    borderWidth: 0,
    outline: "none",
    resize: "none",
    overflow: "hidden",
    verticalAlign: "top",
    background: "transparent",
  });
});

watchEffect(() => {
  if (!inputRef.value) return;
  if (autoFocus) inputRef.value.focus();
  /* Focus cursor at the end */
  inputRef.value.selectionStart = castToString(value)?.length ?? 0;
});

function handleTextAreaChange(e: any) {
  onChange?.(e.target.value, cell);
}

function handleTextAreaKeydown(e: KeyboardEvent) {
  if (!inputRef.value) return;
  const target = e.target as HTMLTextAreaElement;
  const isShiftKey = e.shiftKey;
  const value = inputRef.value.value; // Enter key if (e.which === KeyCodes.Enter) {

  if (e.which === KeyCodes.Enter) {
    onSubmit &&
      onSubmit(
        value,
        cell,
        nextFocusableCell?.(cell, isShiftKey ? Direction.Up : Direction.Down)
      );
  }

  if (e.which === KeyCodes.Escape) {
    onCancel && onCancel(e);
  }

  if (e.which === KeyCodes.Tab) {
    e.preventDefault();
    onSubmit &&
      onSubmit(
        value,
        cell,
        nextFocusableCell?.(cell, isShiftKey ? Direction.Left : Direction.Right)
      );
  }

  onKeyDown?.(e);
}

function handleTextAreaInput(e: InputEvent) {
  const target = e.target as HTMLTextAreaElement;
  defaultValue.value = target.value;
  emits("updateForDataVerification", defaultValue.value);
}
</script>
