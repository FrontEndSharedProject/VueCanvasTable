<template>
  <v-layer>
    <!-- cell 渲染   -->
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
          @mouseenter="handleMouseenter(rowData.index)"
        >
          <v-rect
            :config="{
              x: rowHeaderWidth,
              y: 0,
              height: rowData.height,
              width: rowData.width,
              fill: hoverIndex === rowData.index ? 'yellow' : 'white',
            }"
            :shadowForStrokeEnabled="false"
            :hitStrokeWidth="0"
          />
          <v-group
            v-for="cellProps in rowData.cells"
            :key="cellProps.id"
            :config="{
              clipX: cellProps.x,
              clipY: cellProps.y,
              clipWidth: cellProps.width + 1,
              clipHeight: cellProps.height + 1,
            }"
            :listening="false"
          >
            <Cell :renderProps="cellProps" />
          </v-group>

          <RowHeaderBox :data="rowData.rowHeaderProps" />
        </v-group>
      </v-group>
    </v-group>

    <!--  冻结列渲染  -->
    <v-group
      :config="{
        clipX: 0,
        clipY: frozenRowHeight,
        clipWidth: frozenAreaClipWidth,
        clipHeight: frozenAreaClipHeight,
      }"
    >
      <v-group
        :config="{
          offsetY: scrollState.scrollTop,
          offsetX: 0,
        }"
      >
        <v-group
          v-for="rowData in frozenColumnCells"
          :config="{
            y: rowData.y,
            x: rowData.x,
            height: rowData.height,
          }"
          :key="rowData.index"
          @mouseenter="handleMouseenter(rowData.index)"
        >
          <v-rect
            :config="{
              x: rowHeaderWidth,
              y: 0,
              height: rowData.height,
              width: rowData.width,
              fill: hoverIndex === rowData.index ? 'yellow' : 'white',
            }"
          />
          <v-group
            v-for="cellProps in rowData.cells"
            :key="cellProps.id"
            :config="{
              clipX: cellProps.x,
              clipY: cellProps.y,
              clipWidth: cellProps.width + 1,
              clipHeight: cellProps.height + 1,
            }"
          >
            <Cell :renderProps="cellProps" />
          </v-group>

          <RowHeaderBox :data="rowData.rowHeaderProps" />
        </v-group>
      </v-group>
    </v-group>
  </v-layer>
</template>

<script lang="ts" setup="">
import { useStore } from "$vct/hooks/useStore";
import { Cell } from "$vct/Cell/index";
import { useCellRender } from "$vct/Cell/hooks/useCellRender";
import { useDimensions } from "$vct/hooks/useDimensions";
import { RowHeaderBox } from "$vct/Cell/RowHeaderBox";
import { ref } from "vue";

const {
  cellsAreaClipWidth,
  cellsAreaClipHeight,
  frozenAreaClipWidth,
  frozenAreaClipHeight,
  rowHeaderWidth,
  frozenColumnWidth,
  frozenRowHeight,
} = useDimensions();

const { scrollState } = useStore();

const { cells, frozenColumnCells } = useCellRender();

const hoverIndex = ref(-1);

function handleMouseenter(index) {
  hoverIndex.value = index;
}
</script>
