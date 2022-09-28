<template>
  <div
    :class="[className]"
    class="wrap"
    ref="wrapRef"
    @click.stop="() => {}"
    @mousedown.stop="() => {}"
    @dblclick.stop="() => {}"
    :style="styleAutoAddPx(parentStyle)"
    :key="renderKey"
    v-if="isShow"
  >
    <textarea
      v-bind="textareaAttrs"
      :style="
        styleAutoAddPx({
          width: width,
          height: height,
        })
      "
      :class="{ isEditable }"
      @keydown.stop="() => {}"
      @mouseup.stop="handleMouseup"
      @change.stop="handleChange"
      v-html="value"
    ></textarea>
  </div>
</template>

<script lang="ts" setup="">
import {
  useNotes,
  defaultNoteWidth,
  defaultNoteHeight,
} from "./hooks/useNotes";
import { computed, CSSProperties, nextTick, onMounted, ref, watch } from "vue";
import { ClassNameEnum, PositionEnum } from "$vct/enums";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useStore } from "$vct/hooks/useStore";
import { useDimensions } from "$vct/hooks/useDimensions";
import { styleAutoAddPx } from "$vct/utils";
import { Note } from "$vct/types";
import { onClickOutside } from "@vueuse/core";

const { isShow, coord, hide } = useNotes();
const { scrollState, tableRef, stageContainerRef } = useStore();
const { rowHeaderWidth } = useDimensions();
const {
  getCellBounds,
  getColumnByColIndex,
  getRowOffset,
  getColumnOffset,
  getColumnWidth,
  getRowHeight,
  isHaveNote,
  getNote,
  isReadonlyCell,
  updateNote,
  getCellCoordsFromOffset,
} = useExpose();

const className = computed(() => ClassNameEnum.CELL_NOTES_WRAP);
const parentStyle = ref<CSSProperties>({});
const renderKey = computed(() => {
  if (!coord.value) return "_";
  return coord.value.rowIndex + "_" + coord.value.columnIndex;
});
const wrapRef = ref<HTMLDivElement>();
const value = ref<string>("");
const width = ref<number>(defaultNoteWidth);
const height = ref<number>(defaultNoteHeight);
const isEditable = computed(() => !isReadonlyCell(coord.value));
const textareaAttrs = computed(() => {
  const attrs: any = {};

  if (!isEditable.value) {
    attrs["readonly"] = true;
  }

  return attrs;
});

onMounted(() => {
  onClickOutside(wrapRef, (e) => {
    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);
    if (!coords) {
      hide(true);
      return;
    } else {
      if (
        coords.rowIndex === coord.value.rowIndex &&
        coords.columnIndex === coord.value.columnIndex
      ) {
        return;
      }

      hide(true);
    }
  });
});

watch(coord, (val) => {
  if (isShow.value && val.rowIndex !== -1) {
    show();
  }
});

function handleChange(e: InputEvent) {
  //  @ts-ignore
  updateNoteHack({ note: e.target.value });
}

function show() {
  const { rowIndex, columnIndex } = coord.value;
  const column = getColumnByColIndex(columnIndex);
  if (!isHaveNote(coord.value)) return;
  const cellRect = getCellRect();
  if (!cellRect) return;
  const { x, y, width: cWidth } = cellRect;
  const note = getNote(coord.value) as Note;
  value.value = note.note;
  width.value = note.width;
  height.value = note.height;

  parentStyle.value = {
    left: x + cWidth + rowHeaderWidth.value,
    top: y,
  };

  nextTick(() => edgeAdjustment());
}

function updateNoteHack(note: Partial<Note>) {
  let noteData = getNote(coord.value);
  if (!noteData) return;
  Object.assign(noteData, note);
  updateNote(noteData);
}

function handleMouseup() {
  if (!wrapRef.value) return;
  const textarea = wrapRef.value.querySelector(
    "textarea"
  ) as HTMLTextAreaElement;
  if (
    textarea.offsetWidth != width.value ||
    textarea.offsetHeight != height.value
  ) {
    updateNoteHack({
      width: textarea.offsetWidth,
      height: textarea.offsetHeight,
    });
  }
  width.value = textarea.offsetWidth;
  height.value = textarea.offsetHeight;
}

/**
 * 边缘溢出检测
 */
function edgeAdjustment() {
  if (!wrapRef.value || !tableRef.value) return;
  const cellRect = getCellRect();
  if (!cellRect) return;
  const { x, y, width, height } = cellRect;
  const {
    x: px,
    y: py,
    width: pw,
    height: ph,
  } = tableRef.value.getBoundingClientRect();
  const {
    x: wrapX,
    y: wrapY,
    width: wrapWidth,
    height: wrapHeight,
  } = wrapRef.value.getBoundingClientRect();
  //
  // if (wrapX + wrapWidth > px + pw) {
  //   parentStyle.value = {
  //     left: x + rowHeaderWidth.value,
  //     top: y,
  //     transform: "translateX(-100%)",
  //   };
  // }
  // if (wrapY + wrapHeight > py + ph) {
  //   parentStyle.value = {
  //     left: x + rowHeaderWidth.value,
  //     top: y,
  //     transform: "translateY(-100%)",
  //   };
  // }
}

function getCellRect(): {
  x: number;
  width: number;
  y: number;
  height: number;
} | void {
  const { rowIndex, columnIndex } = coord.value;
  const bounds = getCellBounds(coord.value);
  const { top, left, right, bottom } = bounds;
  const y = getRowOffset(top) - scrollState.value.scrollTop;
  const x = getColumnOffset(left) - scrollState.value.scrollLeft;
  const width = getColumnWidth(columnIndex);
  const height = getRowHeight(rowIndex);

  return {
    x,
    y,
    width,
    height,
  };
}
</script>

<style lang="less" scoped>
.wrap {
  position: absolute;
  z-index: 9;
  background: #fff;
  border-radius: var(--borderRadius);
  border: 1px solid var(--lineColor);
  box-shadow: var(--cellBoxShadow);
  border-left: 4px solid var(--textColor2);

  textarea {
    box-sizing: border-box;
    display: block;
    background-color: white;
    border: 1px solid rgba(60, 64, 67, 0.15);
    border-radius: 4px;
    color: #5f6368;
    font-family: Roboto, RobotoDraft, Helvetica, Arial, sans-serif;
    font-weight: 500;
    margin: 0;
    outline: none;
    padding: 8px;
    font-size: 12px;
    box-shadow: 0 2px 6px 2px rgb(170 170 170 / 20%);
    resize: none !important;
    border: none;
    &.isEditable {
      resize: both !important;
    }
  }
}
</style>
