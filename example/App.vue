<template>
  <div style="padding-top: 24px; padding-left: 24px">
    <Grid
      :rows="rowsData"
      :row-heights="30"
      :column-height="34"
      :columns="columnsData"
    ></Grid>
    <button @click="handleClick">更数据</button>
  </div>
</template>

<script lang="ts" setup="">
import rowsData from "./data/rows.json";
import columnsData from "./data/columns.json";
import { Grid } from "../src/index";
import { ref } from "vue";

const rowData2 = ref(rowsData);

function getRowHeight(index, row) {
  console.log(index, row);
  return 99;
}

function handleClick() {
  rowData2.value[0]['fields']["3df8c63b-6274-4552-a740-c5e401e22577"] = "abc";
}
</script>
