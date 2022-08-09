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
        <v-group
          v-for="rowData in cells"
          :config="{
            y: rowData.y,
            x: rowData.x,
            height: rowData.height,
          }"
          :key="rowData.index"
        >
          <v-group>
            <Cell
              v-for="cellProps in rowData.cells"
              :key="cellProps.id"
              v-bind="cellProps"
            />
          </v-group>

          <RowHeaderBox :data="rowData.rowHeaderProps" />
        </v-group>
      </v-group>
    </v-group>
  </v-layer>
</template>

<script lang="ts" setup="">
import { useStore } from "@/hooks/useStore";
import { Cell } from "@/Cell/index";
import { useCellRender } from "@/Cell/hooks/useCellRender";
import { useDimensions } from "@/hooks/useDimensions";
import { RowHeaderBox } from "@/Cell/RowHeaderBox";

const {
  cellsAreaClipWidth,
  cellsAreaClipHeight,
  frozenColumnWidth,
  frozenRowHeight,
} = useDimensions();

const { scrollState } = useStore();

const { cells } = useCellRender();
</script>
