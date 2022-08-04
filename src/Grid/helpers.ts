import { Direction } from "@/Grid/enums";
import { useGlobalStoreWithOut } from "@/store/global";
import { cloneDeep, sum } from "lodash-es";
import { CellInterface } from "@/Cell/hooks/useCellRender";

/**
 * 通过 offset 获取指定 col index
 * @param offset
 */
export function getColumnStartIndexForOffset(offset: number): number {
  const globalStore = useGlobalStoreWithOut();
  const colWidths = globalStore.colWidths as number[];
  let index = 0;
  let currentOffset = 0;

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
  let currentOffset = 0;

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
