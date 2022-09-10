<template>
  <div style="padding-top: 24px; padding-left: 24px;height: 100%;width: 100%">
    <div style="height: 100%;width: 100%">
      <Grid
        ref="gridRef"
        :rows="rowsData"
        :columns="columnsDataRef"
        :columnGroups="columnGroups"
        :hiddenColumns="hiddenColumns"
        :colWidths="colWidths"
        :frozenColumns="frozenColumns"
        :sortRowConfigs="sortRowConfigs"
        :contextMenuConfigs="contextMenuConfigs"
        :onCellBeforeRender="onCellBeforeRender"
        :notes="notes"
        :columnStatistics="columnStatistics"
        :columnHeight="34"
        :columnHeaderRender="columnHeaderRender"
        @statisticsUpdate="handleStatisticsUpdate"
        @statisticsSelectionsUpdate="statisticsSelectionsUpdate"
      />
    </div>

    <div class="statistics">
      <div
        v-for="item in statistics"
        :key="item.id"
        :style="{
          width: item.width + 'px',
          display: item.isHidden ? 'none' : 'block',
        }"
      >
        {{ item.value }}
      </div>
    </div>

    <div
      class="statistics-selection"
      v-show="parseInt(statisticsSelectionsUpdatePayload.count) > 0"
    >
      {{ statisticsSelectionsUpdatePayload }}
    </div>

    <div style="margin-top: 120px"></div>
    <button @click="handleClick">更数据</button>
    <button @click="handleHiddenColumns">取消第一行隐藏</button>
    <button @click="handleChangeColumnWidth">修改宽度</button>
    <button @click="handleCancelFrozen">取消冻结</button>
    <button @click="cancelSort">取消排序</button>
    <button @click="setSort">设置排序</button>
    <button @click="updateRows">数据更新</button>
    <button @click="showNote">显示 note</button>
    <button @click="setStatistics">设置统计信息</button>
  </div>
</template>

<script lang="tsx" setup="">
import _rowsData from "./data/rows.json";
import _columnsData from "./data/columns.json";
import { StatisticsType } from "../dist/vueCanvasTable.es";
import {
  ContextMenuItem,
  ContextMenuRenderProps,
  Grid,
  MenuTypeEnum,
  StatisticsUpdatePayload,
  VueCanvasTableMethodsType,
  ColumnRenderProps,
} from "../src/index";
import { ref } from "vue";
import CustomCellRender from "./customCellRender.vue";
import customCellEditor from "./customCellEditor.vue";
import cellTooltiper from "./cellTooltiper.vue";
import { Row } from "../src/Grid/types";
import { FilterRowsConfig } from "../src/types";
import { FilterNextEnum } from "../src/enums";
import ColumnRender from "./ColumnRender.vue";

const rowsData = _rowsData;

const gridRef = ref<VueCanvasTableMethodsType>();
const columnStatistics = ref({});
const sortRowConfigs = ref([
  // {
  //   field: "313019ef-d452-43fb-93aa-a61837103cff",
  //   mode: "asc",
  // },
  // {
  //   field: "dad0545d-4430-445e-b0ff-c711ab65e958",
  //   mode: "desc",
  // },
]);
const statistics = ref<StatisticsUpdatePayload>([]);
const statisticsSelectionsUpdatePayload = ref<{
  sum: string;
  average: string;
  count: string;
}>({
  sum: "0",
  average: "0",
  count: "0",
});

const notes = [
  {
    rowId: "6e435cdd-6384-4310-a082-becbb58be405",
    colId: "dad0545d-4430-445e-b0ff-c711ab65e958",
    note: "我是备注",
    width: 192,
    height: 40,
  },
  {
    rowId: "6e435cdd-6384-4310-a082-becbb58be405",
    colId: "cea8d526-9945-4c8e-9089-fab43cb9ff54",
    note: "2我是备注",
    width: 400,
    height: 80,
  },
];

// const filterRowsConfigs = ref<FilterRowsConfig[]>([
//   {
//     field: "313019ef-d452-43fb-93aa-a61837103cff",
//     value: -30,
//     next: FilterNextEnum.AND,
//     payload: null,
//   },
//   {
//     field: "dad0545d-4430-445e-b0ff-c711ab65e958",
//     value: -500,
//     next: FilterNextEnum.AND,
//     payload: null,
//   },
// ]);

function setStatistics() {
  columnStatistics.value = {
    "3df8c63b-6274-4552-a740-c5e401e22577": 1,
    "313019ef-d452-43fb-93aa-a61837103cff": StatisticsType.SUM,
    "dad0545d-4430-445e-b0ff-c711ab65e958": StatisticsType.AVERAGE,
  };
}

function columnHeaderRender(col: ColumnRenderProps) {
  return <ColumnRender renderProps={col} />;
}

/**
 * 用来做条件格式
 * @param configs
 * @param value
 * @param renderProps
 */
function onCellBeforeRender(configs, value, renderProps) {
  if (renderProps.column.type === "numeric") {
    if (!isNaN(parseFloat(value))) {
      if (parseFloat(value) > 0) {
        configs.backgroundRect.fill = "#d3d3d3";
      }
    }
  }
  return configs;
}

function showNote() {
  gridRef.value.showNoteByCoord({
    rowIndex: 2,
    columnIndex: 4,
  });
}

function handleStatisticsUpdate(payload) {
  statistics.value = payload;
}

function statisticsSelectionsUpdate(payload) {
  statisticsSelectionsUpdatePayload.value = payload;
}

function contextMenuConfigs(
  renderProps: ContextMenuRenderProps,
  menuType: MenuTypeEnum
): ContextMenuItem[] {
  return [
    {
      title: `type ${menuType}`,
      icon: "lucide:edit-3",
      action() {},
    },
    {
      title: "修改字段设置",
      icon: "lucide:edit-3",
      action() {},
    },
    {
      title: "编辑列描述",
      icon: "lucide:info",
      action() {},
    },
    {
      title: "按A-Z排列",
      icon: "tabler:sort-ascending",
      action() {
        const column = gridRef.value.getColumnByColIndex(
          renderProps.endColumnIndex
        );
        gridRef.value.changeSortRowMode(column.id, "asc");
      },
    },
    {
      title: "按Z-A排列",
      icon: "tabler:sort-descending",
      action() {
        const column = gridRef.value.getColumnByColIndex(
          renderProps.endColumnIndex
        );
        gridRef.value.changeSortRowMode(column.id, "desc");
      },
    },
    {
      title: "按日期筛选",
      icon: "jam:filter-f",
      action() {},
    },
    {
      separator: true,
    },
    {
      title: "隐藏列",
      icon: "lucide:eye",
      action() {
        gridRef.value.hiddenColumnByIndex(renderProps.endColumnIndex);
      },
    },
    {
      title: "冻结至此列",
      icon: "icon-park-outline:freeze-column",
      action() {
        gridRef.value.setFrozenColumnByIndex(renderProps.endColumnIndex);
      },
    },
    {
      title: "取消冻结",
      icon: "icon-park-outline:freeze-column",
      action() {
        gridRef.value.cancelFrozenColumn();
      },
    },
    {
      title: "设置分组",
      icon: "lucide:plus-square",
      action() {},
    },
    {
      separator: true,
    },
    {
      title: "取消分组",
      icon: "lucide:plus-square",
      action() {},
    },
    {
      title: "显示分组",
      icon: "lucide:plus-square",
      action() {},
    },
    {
      title: "隐藏分组",
      icon: "lucide:plus-square",
      action() {},
    },
  ];
}

function updateRows() {
  gridRef.value.setRowsData(
    rowsData.filter((r) => {
      return parseInt(r["313019ef-d452-43fb-93aa-a61837103cff"]) > 20;
    })
  );
}

function setSort() {
  sortRowConfigs.value = [
    {
      field: "313019ef-d452-43fb-93aa-a61837103cff",
      mode: "asc",
    },
  ];
}

function cancelSort() {
  sortRowConfigs.value = [];
}

const hiddenColumns = ref(["151604d0-5efe-4442-97a4-715551d62947"]);
const colWidths = ref({
  "151604d0-5efe-4442-97a4-715551d62947": 80,
});
const frozenColumns = ref<number>(0);

function handleCancelFrozen() {
  frozenColumns.value = 0;
}

function handleHiddenColumns() {
  hiddenColumns.value = [];
}

function handleChangeColumnWidth() {
  colWidths.value["151604d0-5efe-4442-97a4-715551d62947"] = 120;
}

const columnsData = _columnsData.map((c) => {
  const icons = {
    select: "lucide:play-circle",
    text: "foundation:text-color",
    numeric: "foundation:text-color",
    date: "tabler:calendar-minus",
    checkbox: "akar-icons:check-box",
  };

  c.icon = icons[c.type];

  if (c.type === "select") {
    c.cellRenderer = CustomCellRender;
    c.cellEditor = customCellEditor;
  }

  if (c.type === "text") {
    c.dataVerification = [
      {
        pattern: "\\d+",
        errorMessage: "必须为数字",
      },
      {
        pattern: "^ZF",
        errorMessage: "必须以 ZF 开头",
      },
    ];
    c.cellTooltiper = cellTooltiper;
  }

  if (c.type === "numeric") {
    c.cellSorter = function (
      left: Row,
      right: Row,
      field: string,
      column: any
    ) {
      let leftValue = left[field] ? left[field] : 0;
      let rightValue = right[field] ? right[field] : 0;
      return parseFloat(leftValue) - parseFloat(rightValue);
    };
  }

  return c;
});

const columnsDataRef = columnsData;

const columnGroups = {
  enable: false,
  configs: [
    {
      column: "3df8c63b-6274-4552-a740-c5e401e22577",
      sort: "asc",
    },
    // {
    //   column: "151604d0-5efe-4442-97a4-715551d62947",
    //   sort: "asc",
    // },
    // {
    //   column: "b8ff9ccd-7283-4139-bf92-e90a4ff5ffc9",
    //   sort: "asc",
    // },
  ],
};

function getRowHeight(index, row) {
  console.log(index, row);
  return 99;
}

function handleClick() {
  rowsData.value[0]["fields"]["3df8c63b-6274-4552-a740-c5e401e22577"] = "abc";
  console.log(
    rowsData.value[0]["fields"]["3df8c63b-6274-4552-a740-c5e401e22577"]
  );
}
</script>

<style lang="less">
.statistics {
  border: 1px solid #f20;
  min-height: 44px;
  display: flex;
  flex-direction: row;
  padding-left: 40px;
  div {
    border-left: 1px solid #f20;
    flex-shrink: 0;
  }
}

body {
  background: #e9ecf4;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC,
    Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji", Segoe UI Symbol;
}
</style>
