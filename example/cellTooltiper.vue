<template>
  <div>
    {{ renderProps.value }}
    <a href="https://google.com">google</a>
    <button @click="renderProps.hide">隐藏</button>
  </div>
</template>

<script lang="ts" setup="">
import { CellTooltiperProps, PositionEnum } from "../src";

type Props = {
  renderProps: CellTooltiperProps;
};
const props = withDefaults(defineProps<Props>(), {});
props.renderProps.setParentAttr("position", PositionEnum.LEFT);
</script>
