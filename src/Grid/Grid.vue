<template>
  <section
    class="vue-canvas-table"
    :style="{
      width: width + 'px',
      height: height + 'px',
    }"
    ref="tableRef"
  >
    <ColumnsList />
    <div class="grd-content">
      <div class="grid-container" ref="stageContainerRef" tabIndex="0">
        <v-stage
          ref="stageRef"
          :config="{
            width: stageWidth,
            height: stageHeight,
          }"
        >
          <CellsList />
        </v-stage>
        <selectionChildren />
      </div>
    </div>

    <!--  滚动条  -->
    <div
      class="grid-scrollbar grid-scrollbar-y"
      v-if="scrollState.isShowScrollbarY"
      :style="{
        height: stageHeight + 'px',
        top: columnHeightReactive + 'px',
      }"
      ref="verticalScrollRef"
    >
      <div :style="{ height: contentHeight + 'px' }"></div>
    </div>
    <div
      class="grid-scrollbar grid-scrollbar-x"
      v-if="scrollState.isShowScrollbarX"
      :style="{
        width: stageWidth + 'px',
        left: rowHeaderWidthReactive + 'px',
      }"
      ref="horizontalScrollRef"
    >
      <div :style="{ width: contentWidth + 'px' }"></div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { reactive, ref, unref, watchEffect } from "vue";
import { omit } from "lodash-es";
import { Column, Row } from "@/Grid/types";
import { useRowHeights } from "@/Grid/hooks/useRowHeights";
import { useColWidths } from "@/Grid/hooks/useColWidths";
import { useScroll } from "@/Grid/hooks/useScroll";
import { useDefaultStore } from "@/hooks/useDefaultStore";
import { defaultState, useGlobalStore } from "@/store/global";
import { useStore } from "@/hooks/useStore";
import { CellsList } from "../Cell/index";
import { ColumnsList } from "../Columns/index";
import "./style.less";
import { useDimensions } from "@/hooks/useDimensions";
import { useSelection } from "@/Grid/hooks/useSelection";
import { useExpose } from "@/Grid/hooks/useExpose";
import { ColumnGroupConfig, ColumnGroupConfigProps } from "@/types";

//  @ts-ignore
export type GridProps = {
  width?: number;
  height?: number;
  columns: Column[];
  rows: Row[];
  rowHeights?: number | number[] | ((rowIndex: number, rows: Row[]) => number);
  colWidths?: number | number[] | ((colIndex: number, col: Column[]) => number);
  defaultRowHeight?: number;
  defaultColWidth?: number;
  columnHeight?: number;
  rowHeaderWidth?: number;
  isHiddenRow?(index: number): boolean;
  isHiddenColumn?(index: number): boolean;
  columnGroups?: ColumnGroupConfigProps;
};

//  @ts-ignore
const props = withDefaults(defineProps<GridProps>(), {
  ...omit(defaultState, ["columns", "rows"]),
  columns: () => [],
  rows: () => [],
});

const globalStore = useGlobalStore();

const tableRef = ref<HTMLDivElement>();
const stageRef = ref<any>();
const stageContainerRef = ref<HTMLDivElement>();
const horizontalScrollRef = ref<HTMLDivElement>();
const verticalScrollRef = ref<HTMLDivElement>();

//  保存 refs 到 store 中
watchEffect(() => {
  globalStore.refs.stageRef = unref(stageRef);
  globalStore.refs.tableRef = unref(tableRef);
  globalStore.refs.stageContainerRef = unref(stageContainerRef);
  globalStore.refs.horizontalScrollRef = unref(horizontalScrollRef);
  globalStore.refs.verticalScrollRef = unref(verticalScrollRef);

  if (globalStore.refs.stageRef) {
    console.log(globalStore.refs.stageRef.getStage());
  }
});

const { scrollState } = useStore();

const {
  stageWidth,
  stageHeight,
  rowHeaderWidth: rowHeaderWidthReactive,
  columnHeight: columnHeightReactive,
  contentHeight,
  contentWidth,
} = useDimensions();

useDefaultStore();
useRowHeights();
useColWidths();
useScroll({
  wrap: tableRef,
  horizontalScrollRef,
  verticalScrollRef,
});
const { selectionChildren } = useSelection({
  wrap: tableRef,
});

const { getCellCoordsFromOffset } = useExpose();

defineExpose({
  getCellCoordsFromOffset,
});
</script>
