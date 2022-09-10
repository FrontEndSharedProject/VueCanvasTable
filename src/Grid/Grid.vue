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
      width: '100%',
      height: '100%',
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
import { ClassNameEnum, StatisticsType } from "$vct/enums";
import { GsClipboardOptions } from "gs-clipboard";
import {
  Column,
  ContextMenuItem,
  ContextMenuRenderProps,
  Row,
  ThemesConfig,
} from "$vct/Grid/types";
import { MenuTypeEnum } from "$vct/enums";
import { useRowHeights } from "$vct/Grid/hooks/useRowHeights";
import { useColWidths } from "$vct/Grid/hooks/useColWidths";
import { useScroll } from "$vct/Grid/hooks/useScroll";
import { useDefaultStore } from "$vct/hooks/useDefaultStore";
import { defaultState } from "$vct/store/global";
import { CellsList } from "../Cell/index";
import { useDimensions } from "$vct/hooks/useDimensions";
import { useSelection } from "$vct/Grid/hooks/useSelection";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { ColumnsList } from "../Columns/index";
import {
  ColumnGroupConfigProps,
  FilterRowsConfig,
  Note,
  ShapeConfig,
  SortRowsConfig,
  StatisticsUpdatePayload,
} from "$vct/types";
import { useEditable } from "$vct/Grid/hooks/useEditable";
import { useAutoUpdateUI } from "$vct/hooks/useAutoUpdateUI";
import { init } from "$vct/Grid/init";
import { useRefs } from "$vct/Grid/hooks/useRefs";
import ScrollBars from "./components/ScrollBars.vue";
import FrozenBar from "./components/FrozenBar/index.vue";
import CellTooltip from "./components/CellTooltip/index.vue";
import ContextMenu from "./components/ContextMenu/index.vue";
import Notes from "./components/Notes/index.vue";
import { useThemes } from "$vct/Grid/hooks/useThemes";
import { useRowsQuicklySort } from "$vct/Grid/hooks/useRowsQuicklySort";
import { useCopyPaste } from "$vct/Grid/hooks/useCopyPaste";
import { useRowSelection } from "$vct/Grid/hooks/useRowSelection";
import { RendererProps } from "$vct/Cell/Cell";
import { useStatistics } from "$vct/Grid/hooks/useStatistics";
import { useDragOnEdgeScroll } from "$vct/Grid/hooks/useDragOnEdgeScroll";

//  注册插件
init();

//  @ts-ignore
export type GridProps = {
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
