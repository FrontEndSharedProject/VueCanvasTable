<template>
  <div class="select-editor">
    自定义渲染器
    {{ renderProps.value }}
  </div>
</template>

<script lang="ts" setup="">
import { CellEditorProps } from "../src/types";

type Props = {
  renderProps: CellEditorProps;
};
const props = withDefaults(defineProps<Props>(), {});
console.log(props)
</script>

<style lang="less">
.select-editor{
  width: 120px;
  height: 120px;
  background: #fff;
  border: 1px solid #131313;
}
</style>
