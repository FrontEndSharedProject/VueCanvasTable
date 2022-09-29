import {
  ref,
  Ref,
  unref,
  VNode,
  watch,
  watchEffect,
  shallowRef,
  ShallowRef,
} from "vue";
import { CellInterface, SelectionArea, SelectionProps } from "$vct/types";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useStore } from "$vct/hooks/useStore";
import Selection from "../components/Selection";
import { useDimensions } from "$vct/hooks/useDimensions";
import { isEqual } from "lodash-es";
import { styleAutoAddPx } from "$vct/utils";
import { useFillHandler } from "$vct/Grid/hooks/useFillHandler";
import { useGlobalStore } from "$vct/store/global";

type Props = {
  selections: Ref<SelectionArea[]>;
  activeCell: Ref<CellInterface | null>;
  fillSelection: Ref<SelectionArea | null>;
  methods: any;
};

type ReturnType = {
  selectionChildren: ShallowRef<VNode>;
};

export function useSelectionRender(props: Props): ReturnType {
  //  配置项
  const activeCellStrokeWidth = 2;
  const isDraggingSelection = false;
  const enableSelectionDrag = false;
  const fillHandleWidth = 8;
  const selectionBackgroundColor = "rgba(85, 131, 241, 0.15)";
  const selectionStrokeWidth = 1;
  const showFillHandle = true;
  const fillHandlerBorderColor = "white";

  const globalStore = useGlobalStore();

  const {
    getCellBounds,
    getRowOffset,
    getRowHeight,
    getColumnOffset,
    getColumnWidth,
  } = useExpose();
  const { frozenColumnWidth, frozenRowHeight, rowHeaderWidth, stageHeight } =
    useDimensions();
  const { scrollState, frozenColumns, frozenRows, themes, rowAreaBounds } =
    useStore();
  const selectionBorderColor = themes.value.main;

  const { getFillHandlerVNode } = useFillHandler({
    activeCell: props.activeCell,
    selections: props.selections,
    fillSelection: props.fillSelection,
    methods: props.methods,
    setFillSelection(val) {
      globalStore.fillSelection = val;
    },
    setSelections(val) {
      globalStore.selections = val;
    },
  });

  /**
   * 注意: 下面这些变量声明后，每次执行更新时需要重新初始化下
   * 这样可以避免选区重叠的问题
   */
  //  active cell
  let fillHandleDimension: any = {};
  let activeCellSelection: any = null;
  let activeCellSelectionFrozenColumn: any = null;
  let activeCellSelectionFrozenRow: any = null;
  let activeCellSelectionFrozenIntersection: any = null;

  //  selection
  let isSelectionInProgress = false;
  let selectionAreas: VNode[] = [];
  let selectionAreasFrozenColumns: VNode[] = [];
  let selectionAreasFrozenRows: VNode[] = [];
  let selectionAreasIntersection: VNode[] = [];

  //  fill selections
  let fillSelections: VNode | null = null;

  const selectionRenderer = (props: SelectionProps) => {
    return <Selection {...props} />;
  };

  const selectionChildren = shallowRef<VNode>(<div></div>);

  watch(
    () => {
      return [
        props.selections,
        props.activeCell,
        props.fillSelection,
        scrollState,
      ];
    },
    () => {
      reRender();
    },
    {
      deep: true,
      immediate: true,
    }
  );

  /**
   * 填充选区渲染
   */
  function renderFillSelection() {
    fillSelections = null;
    if (props.fillSelection.value) {
      const { bounds } = props.fillSelection.value;
      const { top, left, right, bottom } = bounds;
      const actualBottom = Math.min(scrollState.value.rowStopIndex, bottom);
      const actualRight = Math.min(scrollState.value.columnStopIndex, right);
      const x = getColumnOffset(left);
      const y = getRowOffset(top);
      const height =
        getRowOffset(actualBottom) - y + getRowHeight(actualBottom);
      const width =
        getColumnOffset(actualRight) - x + getColumnWidth(actualRight);

      fillSelections = selectionRenderer({
        type: "fill",
        x: x,
        y: y,
        width,
        height,
        key: -1,
        stroke: "gray",
        strokeStyle: "dashed",
      });
    }
  }

  /**
   * 渲染选区
   */
  function renderSelection() {
    isSelectionInProgress = false;
    selectionAreas = [];
    selectionAreasFrozenColumns = [];
    selectionAreasFrozenRows = [];
    selectionAreasIntersection = [];

    if (props.selections.value) {
      for (let i = 0; i < unref(props.selections).length; i++) {
        const selection = props.selections.value[i];
        const { bounds, inProgress, style } = selection;
        const { top, left, right, bottom } = bounds;
        const selectionBounds = { x: 0, y: 0, width: 0, height: 0 };
        const actualBottom = Math.min(scrollState.value.rowStopIndex, bottom);
        const actualRight = Math.min(scrollState.value.columnStopIndex, right);
        const isLeftBoundFrozen = left < unref(frozenColumns);
        const isTopBoundFrozen = top < unref(frozenRows);
        const isIntersectionFrozen =
          top < unref(frozenRows) && left < unref(frozenColumns);
        const isLast = i === props.selections.value.length - 1;
        const styles = {
          stroke: inProgress ? selectionBackgroundColor : selectionBorderColor,
          fill: selectionBackgroundColor,
          strokeWidth: isDraggingSelection ? 0 : 1,
          isDragging: isDraggingSelection,
          draggable: inProgress ? false : enableSelectionDrag,
          ...style,
        };
        /**
         * If selection is in progress,
         * use this variable to hide fill handle
         */
        if (inProgress) {
          isSelectionInProgress = true;
        }
        selectionBounds.y = getRowOffset(top);
        selectionBounds.height =
          getRowOffset(actualBottom) -
          selectionBounds.y +
          getRowHeight(actualBottom);

        selectionBounds.x = getColumnOffset(left);

        selectionBounds.width =
          getColumnOffset(actualRight) -
          selectionBounds.x +
          getColumnWidth(actualRight);

        if (isLeftBoundFrozen) {
          const frozenColumnSelectionWidth =
            getColumnOffset(Math.min(right + 1, unref(frozenColumns))) -
            getColumnOffset(left);
          selectionAreasFrozenColumns.push(
            selectionRenderer({
              ...styles,
              type: "selection",
              key: i,
              x: selectionBounds.x,
              y: selectionBounds.y,
              width: frozenColumnSelectionWidth,
              height: selectionBounds.height,
              strokeRightWidth:
                frozenColumnSelectionWidth === selectionBounds.width &&
                !isDraggingSelection
                  ? selectionStrokeWidth
                  : 0,
              selection,
              inProgress,
            })
          );
        }

        if (isTopBoundFrozen) {
          const frozenRowSelectionHeight =
            getRowOffset(Math.min(bottom + 1, unref(frozenRows))) -
            getRowOffset(top);
          selectionAreasFrozenRows.push(
            selectionRenderer({
              ...styles,
              type: "selection",
              key: i,
              x: selectionBounds.x,
              y: selectionBounds.y,
              width: selectionBounds.width,
              height: frozenRowSelectionHeight,
              strokeBottomWidth:
                frozenRowSelectionHeight === selectionBounds.height &&
                !isDraggingSelection
                  ? selectionStrokeWidth
                  : 0,
              selection,
              inProgress,
            })
          );
        }

        if (isIntersectionFrozen) {
          const frozenIntersectionSelectionHeight =
            getRowOffset(Math.min(bottom + 1, unref(frozenRows))) -
            getRowOffset(top);

          const frozenIntersectionSelectionWidth =
            getColumnOffset(Math.min(right + 1, unref(frozenColumns))) -
            getColumnOffset(left);

          selectionAreasIntersection.push(
            selectionRenderer({
              ...styles,
              type: "selection",
              key: i,
              x: selectionBounds.x,
              y: selectionBounds.y,
              width: frozenIntersectionSelectionWidth,
              height: frozenIntersectionSelectionHeight,
              strokeBottomWidth:
                frozenIntersectionSelectionHeight === selectionBounds.height &&
                !isDraggingSelection
                  ? selectionStrokeWidth
                  : 0,
              strokeRightWidth:
                frozenIntersectionSelectionWidth === selectionBounds.width &&
                !isDraggingSelection
                  ? selectionStrokeWidth
                  : 0,
              selection,
              inProgress,
            })
          );
        }

        selectionAreas.push(
          selectionRenderer({
            ...styles,
            type: "selection",
            key: i,
            x: selectionBounds.x,
            y: selectionBounds.y,
            width: selectionBounds.width,
            height: selectionBounds.height,
            selection,
            inProgress,
          })
        );

        if (isLast) {
          fillHandleDimension = {
            x: selectionBounds.x + selectionBounds.width,
            y: selectionBounds.y + selectionBounds.height,
          };
        }
      }
    }
  }

  /**
   * 渲染当前选中 cell 逻辑
   */
  function renderActiveCell() {
    fillHandleDimension = {};
    activeCellSelection = null;
    activeCellSelectionFrozenColumn = null;
    activeCellSelectionFrozenRow = null;
    activeCellSelectionFrozenIntersection = null;

    if (props.activeCell.value) {
      const bounds = getCellBounds(props.activeCell.value);
      const { top, left, right, bottom } = bounds;
      const actualBottom = Math.min(scrollState.value.rowStopIndex, bottom);
      const actualRight = Math.min(scrollState.value.columnStopIndex, right);
      const isInFrozenColumn = left < unref(frozenColumns);
      const isInFrozenRow = top < unref(frozenRows);
      const isInFrozenIntersection = isInFrozenRow && isInFrozenColumn;
      const y = getRowOffset(top);
      const height =
        getRowOffset(actualBottom) - y + getRowHeight(actualBottom);
      const x = getColumnOffset(left);
      const width =
        getColumnOffset(actualRight) - x + getColumnWidth(actualRight);

      const cell = selectionRenderer({
        stroke: selectionBorderColor,
        strokeWidth: activeCellStrokeWidth,
        fill: "transparent",
        x: x,
        y: y,
        width: width,
        height: height,
        type: "activeCell",
        key: 0,
        activeCell: props.activeCell.value,
        isDragging: isDraggingSelection,
        /* Active cell is draggable only there are no other selections */
        draggable: enableSelectionDrag && !props.selections.value.length,
      });

      if (isInFrozenIntersection) {
        activeCellSelectionFrozenIntersection = cell;
      } else if (isInFrozenRow) {
        activeCellSelectionFrozenRow = cell;
      } else if (isInFrozenColumn) {
        activeCellSelectionFrozenColumn = cell;
      } else {
        activeCellSelection = cell;
      }

      fillHandleDimension = {
        x: x + width,
        y: y + height,
      };
    }
  }

  function reRender() {
    renderActiveCell();
    renderSelection();
    renderFillSelection();

    reUpdate();
  }

  function reUpdate() {
    const fillHandlerComponent =
      showFillHandle && !isSelectionInProgress && props.activeCell.value ? (
        getFillHandlerVNode({
          fillHandleDimension,
          stroke: selectionBorderColor,
          size: fillHandleWidth,
          borderColor: fillHandlerBorderColor,
        })
      ) : (
        <div />
      );

    //  计算显示区域的 bottom 值
    //  该值从 addNewRow 的 y 值得来
    let areaBottom =
      rowAreaBounds.value.length > 0
        ? rowAreaBounds.value[rowAreaBounds.value.length - 1].bottom
        : 0;
    areaBottom = areaBottom - scrollState.value.scrollTop;
    areaBottom = stageHeight.value - areaBottom;
    areaBottom = Math.max(0, areaBottom - 4);

    selectionChildren.value = (
      <div
        class="selection-area"
        style={{
          pointerEvents: "none",
        }}
      >
        <div
          style={styleAutoAddPx({
            position: "absolute",
            left: unref(frozenColumnWidth) + unref(rowHeaderWidth),
            top: unref(frozenRowHeight),
            right: 0,
            bottom: areaBottom,
            overflow: "hidden",
          })}
        >
          <div
            style={{
              transform: `
              translateX(${
                (scrollState.value.scrollLeft + unref(frozenColumnWidth)) * -1
              }px) 
              translateY(${
                (scrollState.value.scrollTop + unref(frozenRowHeight)) * -1
              }px)
              `,
            }}
          >
            {fillSelections}
            {selectionAreas}
            {activeCellSelection}
            {fillHandlerComponent}
          </div>
        </div>
        <div
          style={styleAutoAddPx({
            position: "absolute",
            width: unref(frozenColumnWidth) + fillHandleWidth,
            top: unref(frozenRowHeight),
            left: unref(rowHeaderWidth),
            bottom: areaBottom,
            overflow: "hidden",
          })}
          class="frozen-column-dive-box"
        >
          <div
            style={{
              transform: `translate(0, ${
                (scrollState.value.scrollTop + unref(frozenRowHeight)) * -1
              }px)`,
            }}
          >
            {selectionAreasFrozenColumns}
            {activeCellSelectionFrozenColumn}
            {fillHandlerComponent}
          </div>
        </div>
      </div>
    );
  }

  return {
    selectionChildren,
  };
}
