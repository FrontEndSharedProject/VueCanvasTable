import { Align, Direction, ItemType } from "@/enums";
import { useGlobalStoreWithOut } from "@/store/global";
import { cloneDeep, sum } from "lodash-es";
import { AreaProps, CellInterface } from "@/types";

/**
 * 通过 offset 获取指定 col index
 * @param offset
 */
export function getColumnStartIndexForOffset(offset: number): number {
  const globalStore = useGlobalStoreWithOut();
  const colWidths = globalStore.colWidths as number[];
  let index = 0;
  let currentOffset = colWidths[index];

  while (index < colWidths.length - 1 && offset > currentOffset) {
    index++;
    currentOffset += colWidths[index];
  }

  return index;
}

/**
 * 通过 startIndex 获取 endIndex column
 * @param startIndex
 */
export function getColumnStopIndexForStartIndex(startIndex: number): number {
  const globalStore = useGlobalStoreWithOut();
  const colWidths = globalStore.colWidths as number[];
  let currentOffset = sum(cloneDeep(colWidths).splice(0, startIndex));
  let maxOffset = currentOffset + globalStore.height;
  let index = startIndex;

  while (startIndex < colWidths.length - 1 && maxOffset > currentOffset) {
    index++;
    currentOffset += colWidths[index];
  }

  return index;
}

/**
 * 通过 offset 获取指定的 row index
 * @param offset
 */
export function getRowStartIndexForOffset(offset: number): number {
  const globalStore = useGlobalStoreWithOut();
  const rowHeights = globalStore.rowHeights as number[];
  let index = 0;
  let currentOffset = rowHeights[0];

  while (index < rowHeights.length - 1 && offset > currentOffset) {
    index++;
    currentOffset += rowHeights[index];
  }

  return index;
}

/**
 * 通过 startIndex 获取 endIndex
 * @param startIndex
 */
export function getRowStopIndexForStartIndex(startIndex: number): number {
  const globalStore = useGlobalStoreWithOut();
  const rowHeights = globalStore.rowHeights as number[];
  let currentOffset = sum(cloneDeep(rowHeights).splice(0, startIndex));
  let maxOffset = currentOffset + globalStore.height;
  let index = startIndex;

  while (startIndex < rowHeights.length - 1 && maxOffset > currentOffset) {
    index++;
    currentOffset += rowHeights[index];
  }

  return index;
}

/**
 * Find next row Index
 * @param rowIndex
 * @param direction
 */
export type HiddenType = (i: number) => boolean;
export const clampIndex = (
  index: number,
  isHidden: HiddenType | undefined,
  direction: Direction
) => {
  switch (direction) {
    case Direction.Right:
    case Direction.Down:
      let hidden = isHidden?.(index);
      while (hidden === true) {
        hidden = isHidden?.(++index);
      }
      break;

    case Direction.Left:
    case Direction.Up: {
      let hidden = isHidden?.(index);
      while (hidden === true) {
        hidden = isHidden?.(--index);
      }
      break;
    }
  }
  return index;
};

export function itemKey({ rowIndex, columnIndex }: CellInterface) {
  return `${rowIndex}:${columnIndex}`;
}

export function isNull(value: any) {
  return value === void 0 || value === null || value === "";
}

export function cellIdentifier(rowIndex: number, columnIndex: number): string {
  return `${rowIndex},${columnIndex}`;
}

export function getBoundedCells(area: AreaProps | null | undefined) {
  const cells = new Set();
  if (!area) return cells;
  const { top, bottom, left, right } = area;
  for (let i = top; i <= bottom; i++) {
    for (let j = left; j <= right; j++) {
      cells.add(cellIdentifier(i, j));
    }
  }
  return cells;
}

export function isEqualCells(a: CellInterface | null, b: CellInterface | null) {
  if (isNull(a) || isNull(b) || a === null || b === null) return false;
  return a.rowIndex === b.rowIndex && a.columnIndex === b.columnIndex;
}

/**
 * Convert 2 cells to bounds
 * @param start
 * @param end
 * @returns
 *
 * 2 loops O(n)
 */
export function cellRangeToBounds(
  start: CellInterface,
  end: CellInterface,
  spanMerges: boolean = true,
  getCellBounds: (cell: CellInterface) => AreaProps
) {
  let top = Math.min(start.rowIndex, end.rowIndex);
  let bottom = Math.max(start.rowIndex, end.rowIndex);
  let left = Math.min(start.columnIndex, end.columnIndex);
  let right = Math.max(start.columnIndex, end.columnIndex);
  /**
   * The idea is that
   * We do 2 loops >
   * Left to Right and then top to bottom
   *  => Find top cell and bottom cell and check
   * if there are any merged cells at the edge
   * Then keep extending our top and bottom bounds accordingly
   *
   * Same goes for Top to bottom
   *  => Find left most and right most cells
   */

  if (spanMerges) {
    for (let columnIndex = left; columnIndex <= right; columnIndex++) {
      const topCell = getCellBounds({ rowIndex: top, columnIndex });
      const bottomCell = getCellBounds({ rowIndex: bottom, columnIndex });
      bottom = Math.max(topCell.bottom, bottomCell.bottom, bottom);
      top = Math.min(topCell.top, bottomCell.top, top);
    }
    for (let rowIndex = top; rowIndex <= bottom; rowIndex++) {
      const topCell = getCellBounds({ rowIndex, columnIndex: left });
      const bottomCell = getCellBounds({ rowIndex, columnIndex: right });
      right = Math.max(topCell.right, bottomCell.right, right);
      left = Math.min(topCell.left, bottomCell.left, left);
    }
  }

  return {
    top,
    left,
    right,
    bottom,
  };
}

//  grid/packages/grid/src/helpers.ts:538
export function getOffsetForColumnAndAlignment(payload: {
  itemType: ItemType;
  index: number;
  itemOffset: number;
  scrollOffset: number;
  estimatedTotalWidth: number;
  estimatedTotalHeight: number;
  stageWidth: number;
  stageHeight: number;
  frozenOffset: number;
  scrollbarSize: number;
  itemSize: number;
}): number {
  const size =
    payload.itemType === ItemType.column
      ? payload.stageWidth
      : payload.stageHeight;

  // Get estimated total size after ItemMetadata is computed,
  // To ensure it reflects actual measurements instead of just estimates.
  const estimatedTotalSize =
    payload.itemType === ItemType.column
      ? payload.estimatedTotalWidth
      : payload.estimatedTotalHeight;

  const maxOffset = Math.max(
    0,
    Math.min(
      estimatedTotalSize - size,
      payload.itemOffset - payload.frozenOffset
    )
  );
  const minOffset = Math.max(
    0,
    payload.itemOffset - size + payload.scrollbarSize + payload.itemSize
  );

  if (payload.scrollOffset >= minOffset && payload.scrollOffset <= maxOffset) {
    return payload.scrollOffset;
  } else if (minOffset > maxOffset) {
    // Because we only take into account the scrollbar size when calculating minOffset
    // this value can be larger than maxOffset when at the end of the list
    return minOffset;
  } else if (payload.scrollOffset < minOffset) {
    return minOffset;
  } else {
    return maxOffset;
  }
}
