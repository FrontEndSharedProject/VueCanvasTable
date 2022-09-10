<template>
  <v-group :config="groupConfig">
    <v-text :text="value.value" :config="textConfig" />

    <v-group
      :config="iconGroupConfig"
      @mouseout="handleMouseout"
      @mouseenter="handleMouseenter"
      @click="handleIconClick"
    >
      <v-rect :config="rectConfig" />
      <v-path :config="pathConfig" />
    </v-group>
  </v-group>
</template>

<script lang="ts" setup="">
import { computed, reactive, Ref, ref, shallowRef } from "vue";
import { RendererProps } from "../src/Cell/Cell";
import { chevronDown } from "$vct/icons/icons";

type Props = {
  value: Ref<string>;
  renderProps: RendererProps;
};
const props = withDefaults(defineProps<Props>(), {});

const groupConfig = {
  x: props.renderProps.x + 0.5,
  y: props.renderProps.y + 0.5,
  height: props.renderProps.height,
  width: props.renderProps.width,
};

const iconGroupConfig = {
  x: 100,
  y: 8,
};

const pathConfig = {
  x: 0,
  y: 0,
  width: 40,
  height: 40,
  data: chevronDown,
  stroke: "#131313",
  scaleX: 0.6,
  scaleY: 0.6,
};

const rectConfig = reactive({
  x: 0,
  y: 0,
  width: 16,
  height: 16,
  fill: "transparent",
});

const textConfig = shallowRef({
  x: 0,
  y: 0,
  height: props.renderProps.height,
  width: props.renderProps.width,
  fill: "#000",
});

function handleMouseenter() {
  rectConfig.fill = "#d3d3d3";
}

function handleMouseout() {
  rectConfig.fill = "transparent";
}

function handleIconClick() {
  console.log(2);
}
</script>
