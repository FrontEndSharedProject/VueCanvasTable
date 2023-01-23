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
    <childrenVNode :key="renderKey" :renderProps="renderProps" />
  </div>
</template>

<script lang="tsx" setup="">
import { useCellTooltip } from "./hooks/useCellTooltip";
import {
  computed,
  CSSProperties,
  nextTick,
  onMounted,
  ref,
  shallowRef,
  toRaw,
  watch,
} from "vue";
import { PositionEnum, ClassNameEnum } from "$vct/enums";
import { styleAutoAddPx } from "$vct/utils";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useStore } from "$vct/hooks/useStore";
import { useDimensions } from "$vct/hooks/useDimensions";
import { CellTooltiperProps } from "$vct/types";
import { Row } from "$vct/Grid/types";
import { useDataVerification } from "$vct/Grid/hooks/useDataVerification";

const { isShow, coord, hide } = useCellTooltip();
const {
  getCellBounds,
  getColumnByColIndex,
  getRowOffset,
  getColumnOffset,
  getColumnWidth,
  getCellValueByCoord,
  getRowByIndex,
  getRowHeight,
} = useExpose();
const { scrollState, tableRef } = useStore();
const { rowHeaderWidth } = useDimensions();
const { verify } = useDataVerification();

const className = computed(() => ClassNameEnum.CELL_TOOLTIP_WRAP);
const position = ref<PositionEnum>(PositionEnum.BOTTOM);
const parentStyle = ref<CSSProperties>({});
const childrenVNode = shallowRef(<div></div>);
const renderProps = ref<CellTooltiperProps | null>(null);
const wrapRef = ref<HTMLDivElement>();
const renderKey = computed(() => {
  if (!renderProps.value) return "_";
  return renderProps.value.rowIndex + "_" + renderProps.value.columnIndex;
});

const isHaveDataVerificationError = computed(() => {
  if (!renderProps.value) return false;
  if (renderProps.value.column.dataVerification) {
    return !!verify(
      renderProps.value.value,
      renderProps.value.column.dataVerification
    );
  }

  return false;
});

watch(coord, (val) => {
  if (isShow.value && val.rowIndex !== -1) {
    show();
  }
});

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

function show() {
  const { rowIndex, columnIndex } = coord.value;
  const column = getColumnByColIndex(columnIndex);
  if (!column || !column.cellTooltiper) return;
  const cellRect = getCellRect();
  if (!cellRect) return;
  const { x, y, width, height } = cellRect;

  parentStyle.value = {
    left: x + width + rowHeaderWidth.value,
    top: y,
  };

  childrenVNode.value = toRaw(column.cellTooltiper);

  renderProps.value = {
    value: getCellValueByCoord({ rowIndex, columnIndex }, false),
    row: getRowByIndex(rowIndex) as Row,
    rowIndex: rowIndex,
    columnIndex: columnIndex,
    column: column,
    hide: hide,
    setParentAttr,
    edgeAdjustment,
  };

  nextTick(() => edgeAdjustment());
}

function setParentAttr(
  key: "zIndex" | "position",
  value: number | PositionEnum
) {
  if (key === "zIndex") {
    parentStyle.value.zIndex = value as number;
  }
  if (key === "position") {
    const cellRect = getCellRect();
    if (!cellRect) return;
    const { x, y, width, height } = cellRect;

    if (value === PositionEnum.RIGHT) {
      parentStyle.value = {
        left: x + width + rowHeaderWidth.value,
        top: y,
      };
    }

    if (value === PositionEnum.TOP) {
      parentStyle.value = {
        left: x + rowHeaderWidth.value,
        top: y,
        transform: "translateY(-100%)",
      };
    }

    if (value === PositionEnum.BOTTOM) {
      parentStyle.value = {
        left: x + rowHeaderWidth.value,
        top: y + height,
      };
    }

    if (value === PositionEnum.LEFT) {
      parentStyle.value = {
        left: x + rowHeaderWidth.value,
        top: y,
        transform: "translateX(-100%)",
      };
    }
  }
}

/**
 * 边缘溢出检测
 */
function edgeAdjustment() {
  if (!wrapRef.value || !tableRef.value) return;
  const { x, y, width, height } = wrapRef.value.getBoundingClientRect();
  const {
    x: px,
    y: py,
    width: pw,
    height: ph,
  } = tableRef.value.getBoundingClientRect();

  if (x < px) {
    setParentAttr("position", PositionEnum.RIGHT);
  }
  if (y < py) {
    setParentAttr("position", PositionEnum.BOTTOM);
  }
  if (x + width > px + pw) {
    setParentAttr("position", PositionEnum.LEFT);
  }
  if (y + height > py + ph) {
    setParentAttr("position", PositionEnum.TOP);
  }
}
</script>

<style lang="less" scoped>
.wrap {
  position: absolute;
  z-index: 9;
  user-select: text;
}

.wrap:has(.tooltip) {
  background: #fff;
  border-radius: var(--borderRadius);
  border: 1px solid var(--lineColor);
  box-shadow: var(--cellBoxShadow);
}
</style>
