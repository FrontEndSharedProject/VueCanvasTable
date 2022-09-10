<template>
  <div
    class="columns-resizer-line"
    :style="{ left: left + 'px', bottom: scrollbarSize + 'px' }"
  >
    <div class="block" :style="{ height: columnHeight - 2 + 'px' }" />
  </div>
</template>

<script lang="ts" setup="">
import { useDimensions } from "$vct/hooks/useDimensions";

type Props = {
  left: number;
};
const props = withDefaults(defineProps<Props>(), {});

const { columnHeight, scrollbarSize } = useDimensions();
</script>

<style lang="less" scoped>
.columns-resizer-line {
  cursor: ew-resize;
  position: absolute;
  top: 1px;
  width: 1px;
  background: var(--main);
  z-index: 2;
}

.block {
  position: absolute;
  left: -2px;
  top: 0;
  width: 5px;
  background: var(--main);
}
</style>
