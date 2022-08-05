import {
  AreaProps,
  CellInterface,
  PosXYRequired,
  SelectionArea,
} from "@/types";
import { inject, Ref, ref, unref, VNode } from "vue";
import { FillHandler } from "@/Grid/components/FIllHandler";
import { useStore } from "@/hooks/useStore";
import { useExpose } from "@/Grid/hooks/useExpose";
import { Direction } from "@/enums";

/**
 * 此文件用于处理 fill handler 的逻辑（选区中）
 */

type Props = {
  activeCell: Ref<CellInterface | null>;
  selections: Ref<SelectionArea[]>;
  fillSelection: Ref<SelectionArea | null>;
  methods: any;
  setFillSelection(val: SelectionArea | null): void;
  setSelections(val: SelectionArea[]): void;
};

type GetFillHandlerVNodeProps = {
  fillHandleDimension: PosXYRequired;
  stroke: string;
  size: number;
  borderColor: string;
};

type ReturnType = {
  getFillHandlerVNode(payload: GetFillHandlerVNodeProps): VNode;
};

function onFill(
  activeCell: CellInterface,
  selection: SelectionArea | null,
  selections: SelectionArea[]
) {}

export function useFillHandler(props: Props): ReturnType {
  const selectionFromStartEnd = props.methods.selectionFromStartEnd;

  const { tableRef, columnCount, rowCount } = useStore();
  const {
    getCellCoordsFromOffset,
    getCellBounds,
    scrollToItem,
    focusStageContainer,
  } = useExpose();

  const isFilling = ref<boolean>(false);

  function handleMousedown(e: MouseEvent) {
    e.stopPropagation();
    isFilling.value = true;
    document.addEventListener("mousemove", handleFillHandleMouseMove);
    document.addEventListener("mouseup", handleFillHandleMouseUp);
  }

  function handleFillHandleMouseMove(e: MouseEvent) {
    /* Exit if user is not in selection mode */
    if (!isFilling.value || !tableRef?.value || !props.activeCell.value) return;

    const coords = getCellCoordsFromOffset(e.clientX, e.clientY, false);
    if (!coords) return;
    const selections = props.selections.value;
    let bounds = selectionFromStartEnd(props.activeCell.value, coords);
    const hasSelections = selections.length > 0;
    const activeCellBounds = hasSelections
      ? selections[selections.length - 1].bounds
      : getCellBounds(props.activeCell.value);
    if (!bounds) return;

    const selectionRightBound = unref(columnCount) - 1;
    const selectionBottomBound = unref(rowCount) - 1;
    const selectionTopBound = 0;
    const selectionLeftBound = 0;

    const direction =
      bounds.top < activeCellBounds.top
        ? Direction.Up
        : bounds.bottom > activeCellBounds.bottom
        ? Direction.Down
        : bounds.right > activeCellBounds.right
        ? Direction.Right
        : Direction.Left;

    if (direction === Direction.Right) {
      bounds = {
        ...activeCellBounds,
        right: Math.min(selectionRightBound, bounds.right),
      };
    }

    if (direction === Direction.Up) {
      bounds = {
        ...activeCellBounds,
        top: Math.max(selectionTopBound, bounds.top),
      };
    }

    if (direction === Direction.Left) {
      bounds = {
        ...activeCellBounds,
        left: Math.max(selectionLeftBound, bounds.left),
      };
    }

    if (direction === Direction.Down) {
      bounds = {
        ...activeCellBounds,
        bottom: Math.min(selectionBottomBound, bounds.bottom),
      };
    }

    /**
     * If user moves back to the same selection, clear
     */
    if (
      hasSelections &&
      boundsSubsetOfSelection(bounds, selections[0].bounds)
    ) {
      props.setFillSelection(null);
      return;
    }

    props.setFillSelection({ bounds });

    scrollToItem(coords);
  }

  function handleFillHandleMouseUp(e: MouseEvent) {
    isFilling.value = false;

    /* Remove listener */
    document.removeEventListener("mousemove", handleFillHandleMouseMove);
    document.removeEventListener("mouseup", handleFillHandleMouseUp);

    /* Exit early */
    if (!tableRef.value || !props.activeCell.value) return;

    /* Update last selection */
    let fillSelection: SelectionArea | null = null;

    fillSelection = props.fillSelection.value;
    props.setFillSelection(null);

    /* Use ref, as we are binding to document */
    const selections = props.selections.value;
    const activeCell = props.activeCell.value;
    if (!activeCell || !fillSelection) return;

    const newBounds = (fillSelection as SelectionArea)?.bounds;
    if (!newBounds) return;

    /* Focus on the grid */
    focusStageContainer();

    /* Callback */
    onFill && onFill(activeCell, fillSelection, selections);

    /* Modify last selection */
    const selectionsLength = props.selections.value.length;
    if (!selectionsLength) {
      props.setSelections([{ bounds: newBounds }]);
    } else {
      props.setSelections(
        props.selections.value.map((sel, i) => {
          if (selectionsLength - 1 === i) {
            return {
              ...sel,
              bounds: newBounds,
            };
          }
          return sel;
        })
      );
    }
  }

  function boundsSubsetOfSelection(bounds: AreaProps, selection: AreaProps) {
    return (
      bounds.top >= selection.top &&
      bounds.bottom <= selection.bottom &&
      bounds.left >= selection.left &&
      bounds.right <= selection.right
    );
  }

  function getFillHandlerVNode(payload: GetFillHandlerVNodeProps): VNode {
    return (
      <FillHandler
        {...payload.fillHandleDimension}
        stroke={payload.stroke}
        size={payload.size}
        borderColor={payload.borderColor}
        onMousedown={handleMousedown}
      />
    );
  }

  return {
    getFillHandlerVNode,
  };
}
