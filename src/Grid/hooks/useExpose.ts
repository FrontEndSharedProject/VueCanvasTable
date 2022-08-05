/**
 * 处理 ref 中的 defineExpose 中需要暴露的方法
 */
import { useStore } from "@/hooks/useStore";
import { unref } from "vue";
import { useDimensions } from "@/hooks/useDimensions";
import {
  AreaProps,
  CellInterface,
  OptionalScrollCoords,
  PosXYRequired,
} from "@/types";
import {
  getColumnStartIndexForOffset,
  getOffsetForColumnAndAlignment,
  getRowStartIndexForOffset,
} from "@/helpers";
import { Align, ItemType } from "@/enums";
import { useHelpers } from "@/hooks/useHelpers";
import { useGlobalStore } from "@/store/global";

type ReturnType = {
  getCellCoordsFromOffset(
    left: number,
    top: number,
    includeFrozen?: boolean
  ): CellInterface | null;
  scrollToItem(payload: Partial<CellInterface>): void;
  getCellBounds(payload: CellInterface): AreaProps;
  focusStageContainer(): void;
};

export function useExpose(): ReturnType {
  const globalStore = useGlobalStore();

  const {
    stageRef,
    stageContainerRef,
    frozenRows,
    frozenColumns,
    scrollLeft,
    scrollTop,
    scrollState,
    verticalScrollRef,
    horizontalScrollRef,
  } = useStore();
  const {
    columnHeight,
    rowHeaderWidth,
    stageWidth,
    stageHeight,
    frozenRowHeight,
    frozenColumnWidth,
    contentHeight,
    contentWidth,
    scrollbarSize,
  } = useDimensions();
  const { getRowOffset, getColumnOffset, getRowHeight, getColumnWidth } =
    useHelpers();

  /**
   * Scrolls to cell
   * Respects frozen rows and columns
   */
  function scrollToItem({ rowIndex, columnIndex }: Partial<CellInterface>) {
    const isFrozenRow = rowIndex !== void 0 && rowIndex < unref(frozenRows);
    const isFrozenColumn =
      columnIndex !== void 0 && columnIndex < unref(frozenColumns);
    const frozenColumnOffset = getColumnOffset(unref(frozenColumns));
    /* Making sure getColumnWidth works */
    const x = columnIndex !== void 0 ? getColumnOffset(columnIndex) : void 0;
    /* Making sure getRowHeight works */
    const y = rowIndex !== void 0 ? getRowOffset(rowIndex) : void 0;
    const width = columnIndex !== void 0 ? getColumnWidth(columnIndex) : 0;
    const height = rowIndex !== void 0 ? getRowHeight(rowIndex) : 0;
    const newScrollLeft =
      columnIndex !== void 0 && !isFrozenColumn
        ? getOffsetForColumnAndAlignment({
            stageWidth: unref(stageWidth),
            stageHeight: unref(stageHeight),
            itemType: ItemType.column,
            index: columnIndex,
            itemOffset: getColumnOffset(columnIndex),
            itemSize: getColumnWidth(columnIndex),
            scrollOffset: unref(scrollLeft),
            estimatedTotalWidth: unref(contentWidth),
            estimatedTotalHeight: unref(contentHeight),
            frozenOffset: frozenColumnOffset,
            scrollbarSize: unref(scrollbarSize),
          })
        : void 0;

    const frozenRowOffset = getRowOffset(unref(frozenRows));
    const newScrollTop =
      rowIndex !== void 0 && !isFrozenRow
        ? getOffsetForColumnAndAlignment({
            stageWidth: unref(stageWidth),
            stageHeight: unref(stageHeight),
            itemType: ItemType.row,
            index: rowIndex,
            itemOffset: getRowOffset(rowIndex),
            itemSize: getRowHeight(rowIndex),
            scrollOffset: unref(scrollTop),
            estimatedTotalWidth: unref(contentWidth),
            estimatedTotalHeight: unref(contentHeight),
            frozenOffset: frozenRowOffset,
            scrollbarSize: unref(scrollbarSize),
          })
        : void 0;

    const coords = {
      scrollLeft: newScrollLeft,
      scrollTop: newScrollTop,
    };
    const isOutsideViewport =
      (rowIndex !== void 0 &&
        rowIndex >
          scrollState.value.rowStopIndex +
            (scrollState.value.rowStopIndex -
              scrollState.value.rowStartIndex)) ||
      (columnIndex !== void 0 &&
        columnIndex >
          scrollState.value.columnStopIndex +
            (scrollState.value.columnStopIndex -
              scrollState.value.columnStartIndex));

    /* Scroll in the next frame, Useful when user wants to jump from 1st column to last */
    if (isOutsideViewport) {
      window.requestAnimationFrame(() => {
        scrollTo(coords);
      });
    } else scrollTo(coords);
  }

  /* Find frozen row boundary */
  function isWithinFrozenRowBoundary(y: number) {
    return unref(frozenRows) > 0 && y < unref(frozenRowHeight);
  }

  /* Find frozen column boundary */
  function isWithinFrozenColumnBoundary(x: number) {
    return unref(frozenColumns) > 0 && x < unref(frozenColumnWidth);
  }

  /* Get top, left bounds of a cell */
  function getCellBounds({ rowIndex, columnIndex }: CellInterface): AreaProps {
    return {
      top: rowIndex,
      left: columnIndex,
      right: columnIndex,
      bottom: rowIndex,
    } as AreaProps;
  }

  /**
   * 获取鼠标相对位置
   * @param left
   * @param top
   */
  function getRelativePositionFromOffset(
    left: number,
    top: number
  ): PosXYRequired | null {
    const stageRefTarget = unref(stageRef);
    const stageContainerTarget = unref(stageContainerRef);
    if (!stageRefTarget || !stageContainerTarget) return null;
    const stage = stageRefTarget.getStage();
    const rect = stageContainerTarget.getBoundingClientRect();
    if (rect) {
      left = left - rect.x;
      top = top - rect.y;
    }
    const { x, y } = stage
      .getAbsoluteTransform()
      .copy()
      .invert()
      .point({ x: left, y: top });

    return { x, y };
  }

  /**
   * 获取当前鼠标位置对应的 单元格 坐标信息
   * @param left
   * @param top
   * @param includeFrozen
   */
  function getCellCoordsFromOffset(
    left: number,
    top: number,
    includeFrozen: boolean = true
  ): CellInterface | null {
    const pos = getRelativePositionFromOffset(left, top);
    if (!pos) return null;

    const { x, y } = pos;
    const rowOffset =
      includeFrozen && isWithinFrozenRowBoundary(y) ? y : y + unref(scrollTop);
    const columnOffset =
      includeFrozen && isWithinFrozenColumnBoundary(x)
        ? x
        : x + unref(scrollLeft);
    if (
      rowOffset > unref(contentHeight) ||
      columnOffset > unref(contentWidth)
    ) {
      return null;
    }
    const rowIndex = getRowStartIndexForOffset(rowOffset);
    const columnIndex = getColumnStartIndexForOffset(columnOffset);
    /* To be compatible with merged cells */
    const bounds = getCellBounds({ rowIndex, columnIndex });

    return { rowIndex: bounds.top, columnIndex: bounds.left };
  }

  function scrollTo({ scrollTop, scrollLeft }: OptionalScrollCoords) {
    /* If scrollbar is visible, lets update it which triggers a state change */
    if (true) {
      // if (showScrollbar) {
      if (horizontalScrollRef.value && scrollLeft !== void 0)
        horizontalScrollRef.value.scrollLeft = scrollLeft;
      if (verticalScrollRef.value && scrollTop !== void 0)
        verticalScrollRef.value.scrollTop = scrollTop;
    } else {
      const newScrollState = {
        ...unref(scrollState),
        scrollLeft:
          scrollLeft == void 0 ? unref(scrollState).scrollLeft : scrollLeft,
        scrollTop:
          scrollTop == void 0 ? unref(scrollState).scrollTop : scrollTop,
      };
      globalStore.setScrollState(newScrollState);
    }
  }

  function focusStageContainer(): void {
    if (document.activeElement !== unref(stageContainerRef)) {
      return stageContainerRef.value?.focus();
    }
  }

  return {
    getCellCoordsFromOffset,
    scrollToItem,
    getCellBounds,
    focusStageContainer,
  };
}
