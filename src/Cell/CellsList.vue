<template>
  <v-layer>
    <v-group
      :config="{
        clipX: frozenColumnWidth,
        clipY: frozenRowHeight,
        clipWidth: cellsAreaClipWidth,
        clipHeight: cellsAreaClipHeight,
      }"
    >
      <v-group
        :config="{
          offsetY: scrollState.scrollTop,
          offsetX: scrollState.scrollLeft,
        }"
      >
        <Cell
          v-for="cellProps in cells"
          :key="cellProps.id"
          v-bind="cellProps"
        />
      </v-group>
    </v-group>
  </v-layer>
</template>

<script lang="ts" setup="">
import { useStore } from "@/hooks/useStore";
import { Cell } from "@/Cell/index";
import { useCellRender } from "@/Cell/hooks/useCellRender";
import { useDimensions } from "@/hooks/useDimensions";

const {
  cellsAreaClipWidth,
  cellsAreaClipHeight,
  frozenColumnWidth,
  frozenRowHeight,
} = useDimensions();

const { scrollState } = useStore();

const { cells } = useCellRender();
</script>
