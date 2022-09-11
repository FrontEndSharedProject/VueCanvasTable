<template>
  <div class="column-header full">
    <AIcon :type="renderProps.icon" :size="12" />
    <span class="title">
      {{ renderProps.field }}
    </span>
  </div>
</template>

<script lang="ts" setup="">
import { ColumnRenderProps } from "../src";
import { AIcon } from "$vct/components/AIcon";

type Props = {
  renderProps: ColumnRenderProps;
};
const props = withDefaults(defineProps<Props>(), {});
</script>

<style lang="less" scoped>
.column-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;

  .title{
    padding-left: 4px;
  }
}
</style>
