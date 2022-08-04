<template>
  <section
    :class="{
      isOnTheTop,
      isOnTheBottom,
      isOnTheLeft,
      isOnTheRight,
      [ClassNameEnum.TABLE_WRAP]: true,
    }"
    class="wrap vue-canvas-table-root"
    :style="{
      width: width + 'px',
      height: height + 'px',
      ...themeStyles,
    }"
    ref="tableRef"
  >
    <ColumnsList />
    <div class="grd-content" :key="autoUpdateUIKey">
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
        <SelectionVNode />
        <EditorVNode />
        <Notes v-if="tableRef" />
        <CellTooltip v-if="tableRef" />
      </div>
    </div>

    <ScrollBars ref="_scrollBarsRef" />
    <FrozenBar />
    <ContextMenu v-if="tableRef" />
  </section>
</template>

<script lang="ts" setup>
import { provide, ref, VNode, watch } from "vue";
import { omit } from "lodash-es";
import { ClassNameEnum, StatisticsType } from "@/enums";
import { GsClipboardOptions } from "gs-clipboard";
import {
  Column,
  ContextMenuItem,
  ContextMenuRenderProps,
  Row,
  ThemesConfig,
} from "@/Grid/types";
import { MenuTypeEnum } from "@/enums";
import { useRowHeights } from "@/Grid/hooks/useRowHeights";
import { useColWidths } from "@/Grid/hooks/useColWidths";
import { useScroll } from "@/Grid/hooks/useScroll";
import { useDefaultStore } from "@/hooks/useDefaultStore";
import { defaultState } from "@/store/global";
import { CellsList } from "../Cell/index";
import { useDimensions } from "@/hooks/useDimensions";
import { useSelection } from "@/Grid/hooks/useSelection";
import { useExpose } from "@/Grid/hooks/useExpose";
import { ColumnsList } from "../Columns/index";
import {
  ColumnGroupConfigProps,
  FilterRowsConfig,
  Note,
  ShapeConfig,
  SortRowsConfig,
  StatisticsUpdatePayload,
} from "@/types";
import { useEditable } from "@/Grid/hooks/useEditable";
import { useAutoUpdateUI } from "@/hooks/useAutoUpdateUI";
import { init } from "@/Grid/init";
import { useRefs } from "@/Grid/hooks/useRefs";
import ScrollBars from "./components/ScrollBars.vue";
import FrozenBar from "./components/FrozenBar/index.vue";
import CellTooltip from "./components/CellTooltip/index.vue";
import ContextMenu from "./components/ContextMenu/index.vue";
import Notes from "./components/Notes/index.vue";
import { useThemes } from "@/Grid/hooks/useThemes";
import { useRowsQuicklySort } from "@/Grid/hooks/useRowsQuicklySort";
import { useCopyPaste } from "@/Grid/hooks/useCopyPaste";
import { useRowSelection } from "@/Grid/hooks/useRowSelection";
import { RendererProps } from "@/Cell/Cell";
import { useStatistics } from "@/Grid/hooks/useStatistics";
import { useDragOnEdgeScroll } from "@/Grid/hooks/useDragOnEdgeScroll";

//  注册插件
init();

//  @ts-ignore
export type GridProps = {
  width?: number;
  height?: number;
  columns: Column[];
  rows: Row[];
  rowHeights?: Record<string, number>;
  colWidths?: Record<string, number>;
  defaultRowHeight?: number;
  defaultColWidth?: number;
  columnHeight?: number;
  rowHeaderWidth?: number;
  columnGroups?: ColumnGroupConfigProps;
  hiddenColumns?: string[];
  frozenColumns?: number;
  themes?: ThemesConfig;
  //  行排序规则（快速排序）
  sortRowConfigs?: SortRowsConfig[];
  //  行过滤
  filterRowsConfigs?: FilterRowsConfig[];
  contextMenuConfigs?:
    | null
    | ((
        renderProps: ContextMenuRenderProps,
        menuType: MenuTypeEnum
      ) => ContextMenuItem[]);
  //  gs-clipboard handlers
  GSCHandlers?: GsClipboardOptions["handlers"];
  notes?: Note[];
  columnStatistics?: Record<Column["id"], StatisticsType>;
  columnHeaderRender?: null | (() => VNode);

  //  hooks
  onCellBeforeRender?:
    | undefined
    | ((
        konvaConfigs: {
          backgroundRect: ShapeConfig;
          defaultText: ShapeConfig;
        },
        value: string,
        renderProps: RendererProps
      ) => {
        backgroundRect: ShapeConfig;
        defaultText: ShapeConfig;
      });
};

//  @ts-ignore
const props = withDefaults(defineProps<GridProps>(), {
  ...omit(defaultState, ["columns", "rows"]),
  columns: () => [],
  rows: () => [],
});

const emits = defineEmits<{
  (e: "statisticsUpdate", payload: StatisticsUpdatePayload): void;
  (
    e: "statisticsSelectionsUpdate",
    payload: {
      sum: string;
      average: string;
      count: string;
    }
  ): void;
}>();

provide("rootEmits", emits);

/**
 * 绑定一些 refs 到 globalStore 中
 */
const {
  tableRef,
  stageRef,
  stageContainerRef,
  verticalScrollRef,
  horizontalScrollRef,
} = useRefs();
const _scrollBarsRef = ref();
watch(_scrollBarsRef, (val) => {
  horizontalScrollRef.value = val.horizontalScrollRef;
  verticalScrollRef.value = val.verticalScrollRef;
});

const { stageWidth, stageHeight } = useDimensions();
const { themeStyles } = useThemes();
useDefaultStore();
useRowHeights();
useColWidths();
const { isOnTheTop, isOnTheBottom, isOnTheLeft, isOnTheRight } = useScroll({
  wrap: tableRef,
  horizontalScrollRef,
  verticalScrollRef,
});
useRowsQuicklySort();
useCopyPaste({
  wrap: tableRef,
});
useRowSelection({
  wrap: tableRef,
});
useDragOnEdgeScroll({
  wrap: tableRef,
});
useStatistics(emits);
// useRowsQuicklyFilters();
const { SelectionVNode } = useSelection({
  wrap: tableRef,
});
const { EditorVNode } = useEditable({ wrap: tableRef });
const { autoUpdateUIKey } = useAutoUpdateUI();

defineExpose(useExpose());
</script>

<style lang="less">
.vue-canvas-table-root {
  position: relative;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: auto;

  .selection-area {
    z-index: 9;
    div {
      box-sizing: border-box;
    }
  }

  .grd-content {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-items: flex-start;
  }

  .grid-container {
    position: relative;
    display: flex;
    outline: none;
  }

  &.isOnTheRight {
    .grid-container {
      canvas {
        border-right: 1px solid var(--lineColor) !important;
      }
    }
  }
}
</style>
