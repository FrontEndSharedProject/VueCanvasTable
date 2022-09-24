<template>
  <section class="loading-box" v-if="isShow">
    <slot name="default" />
  </section>
</template>

<script lang="ts" setup="">
import { useGlobalStore } from "$vct/store/global";
import { computed } from "vue";

const globalStore = useGlobalStore();

const isShow = computed(() => globalStore.loading);
</script>

<style lang="less" scoped>
.loading-box {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  z-index: 999;
  background: rgba(#fff, 0.8);
}
</style>
