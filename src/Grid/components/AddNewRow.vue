<template>
  <v-layer>
    <v-group
      :config="groupConfig"
      @mouseenter="handleMouseenter"
      @mouseout="handleMouseout"
      @click="handleClick"
    >
      <v-rect :config="backgroundRectConfig" />
      <v-rect :config="addBtnBackgroundRectConfig" :listening="false" />
      <v-path :config="addBtnPathConfig" :listening="false" />
      <v-text :config="textConfig" :listening="false" />
    </v-group>
  </v-layer>
</template>

<script lang="ts" setup="">
import { computed, ref } from "vue";
import Konva from "konva";
import { useDimensions } from "$vct/hooks/useDimensions";
import { useStore } from "$vct/hooks/useStore";
import { add } from "$vct/icons/icons";
import { useGlobalStore } from "$vct/store/global";

const globalStore = useGlobalStore();
const { stageHeight, stageWidth, rowHeaderWidth } = useDimensions();
const { rowAreaBounds, themes, stageRef, scrollState } = useStore();

const isHover = ref<boolean>(false);
const addNewRowHeight = computed(() => globalStore.addNewRowHeight);
const groupConfig = computed<Konva.GroupConfig>(() => {
  let y =
    rowAreaBounds.value.length > 0
      ? rowAreaBounds.value[rowAreaBounds.value.length - 1].bottom
      : 0;

  y = y - scrollState.value.scrollTop;

  return {
    x: 0,
    y: y,
    height: addNewRowHeight.value,
    width: stageWidth.value,
  };
});

const backgroundRectConfig = computed<Konva.RectConfig>(() => {
  return {
    x: 12,
    y: -0.5,
    height: groupConfig.value.height,
    width: groupConfig.value.width,
    fill: "#fff",
    strokeWidth: 1,
    stroke: themes.value.lineColor,
  };
});

const addBtnBackgroundRectConfig = computed<Konva.RectConfig>(() => {
  return {
    x: 0.5,
    y: -0.5,
    height: groupConfig.value.height,
    width: rowHeaderWidth.value,
    fill: "#fff",
    strokeWidth: 1,
    stroke: themes.value.lineColor,
    cornerRadius: [0, 0, 0, 4],
  };
});

const addBtnPathConfig = computed<Konva.PathConfig>(() => {
  return {
    x: 12,
    y: 7,
    data: add,
    scaleX: 0.7,
    scaleY: 0.7,
    strokeWidth: 2,
    stroke: isHover.value ? themes.value.main : themes.value.textColor2,
  };
});

const textConfig = computed<Konva.TextConfig>(() => {
  return {
    x: rowHeaderWidth.value + 8,
    y: 12,
    text: "新增行",
    fill: themes.value.main,
    visible: isHover.value,
  };
});

function handleMouseenter() {
  if (stageRef.value.getStage) {
    stageRef.value.getStage().container().style.cursor = "pointer";
  }
  isHover.value = true;
}

function handleMouseout() {
  if (stageRef.value.getStage) {
    stageRef.value.getStage().container().style.cursor = "default";
  }
  isHover.value = false;
}

function handleClick() {
  globalStore.onAddNewRowClick && globalStore.onAddNewRowClick();
}
</script>
