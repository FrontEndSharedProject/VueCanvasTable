import { KeyCodes, Direction, ItemType } from "$vct/enums";
import {
  AreaProps,
  CellInterface,
  AreaBounds,
  SelectionArea,
} from "$vct/types";

export const isArrowKey = (keyCode: number) => {
  return [KeyCodes.Up, KeyCodes.Down, KeyCodes.Left, KeyCodes.Right].includes(
    keyCode
  );
};

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

/**
 * Find the next cell
 * @param activeCell
 * @param getValue
 * @param isHidden
 * @param direction
 * @param limit
 */
export function findLastContentfulCell(
  activeCell: CellInterface,
  getValue: ValueGetter,
  isHidden: HiddenType | undefined,
  direction: Direction,
  limit: number
): CellInterface {
  var { rowIndex, columnIndex } = activeCell;
  switch (direction) {
    case Direction.Down: {
      rowIndex = clampIndex(Math.min(rowIndex + 1, limit), isHidden, direction);
      let value = getValue({ rowIndex, columnIndex });
      while (!isNull(value) && rowIndex < limit) {
        rowIndex = clampIndex(Math.min(++rowIndex, limit), isHidden, direction);
        value = getValue({ rowIndex, columnIndex });
      }
      return {
        columnIndex,
        rowIndex: isNull(getValue({ columnIndex, rowIndex }))
          ? rowIndex - 1
          : rowIndex,
      };
    }
    case Direction.Up: {
      rowIndex = clampIndex(Math.max(rowIndex - 1, limit), isHidden, direction);
      let value = getValue({ rowIndex, columnIndex });
      while (!isNull(value) && rowIndex > limit) {
        rowIndex = clampIndex(Math.max(--rowIndex, limit), isHidden, direction);
        value = getValue({ rowIndex, columnIndex });
      }
      return {
        columnIndex,
        rowIndex: isNull(getValue({ columnIndex, rowIndex }))
          ? rowIndex + 1
          : rowIndex,
      };
    }
    case Direction.Right: {
      columnIndex = clampIndex(
        Math.min(columnIndex + 1, limit),
        isHidden,
        direction
      );
      let value = getValue({ rowIndex, columnIndex });
      while (!isNull(value) && columnIndex < limit) {
        columnIndex = clampIndex(
          Math.min(++columnIndex, limit),
          isHidden,
          direction
        );
        value = getValue({ rowIndex, columnIndex });
      }
      return {
        rowIndex,
        columnIndex: isNull(getValue({ columnIndex, rowIndex }))
          ? columnIndex - 1
          : columnIndex,
      };
    }

    case Direction.Left: {
      columnIndex = clampIndex(
        Math.max(columnIndex - 1, limit),
        isHidden,
        direction
      );
      let value = getValue({ rowIndex, columnIndex });
      while (!isNull(value) && columnIndex > limit) {
        columnIndex = clampIndex(
          Math.max(--columnIndex, limit),
          isHidden,
          direction
        );
        value = getValue({ rowIndex, columnIndex });
      }
      return {
        rowIndex,
        columnIndex: isNull(getValue({ columnIndex, rowIndex }))
          ? columnIndex + 1
          : columnIndex,
      };
    }

    default:
      return activeCell;
  }
}

/**
 * Find a cell with content if the current cell is out of the current dataregion
 * [
 *  1, 2, 3,
 *  x, x, x
 *  7, 8, 9
 * ]
 * activeCel = 2
 * direction = Down
 * New Cell = 8
 *
 * @param activeCell
 * @param getValue
 * @param isHidden
 * @param direction
 * @param limit
 */
export function findNextContentfulCell(
  activeCell: CellInterface,
  getValue: ValueGetter,
  isHidden: HiddenType | undefined,
  direction: Direction,
  limit: number
) {
  var { rowIndex, columnIndex } = activeCell;
  switch (direction) {
    case Direction.Down: {
      rowIndex = clampIndex(Math.min(rowIndex + 1, limit), isHidden, direction);
      let value = getValue({ rowIndex, columnIndex });
      while (isNull(value) && rowIndex < limit) {
        rowIndex = clampIndex(Math.min(++rowIndex, limit), isHidden, direction);
        value = getValue({ rowIndex, columnIndex });
      }
      return { rowIndex, columnIndex };
    }

    case Direction.Up: {
      rowIndex = clampIndex(Math.max(rowIndex - 1, limit), isHidden, direction);
      let value = getValue({ rowIndex, columnIndex });
      while (isNull(value) && rowIndex > limit) {
        rowIndex = clampIndex(Math.max(--rowIndex, limit), isHidden, direction);
        value = getValue({ rowIndex, columnIndex });
      }
      return { rowIndex, columnIndex };
    }

    case Direction.Right: {
      columnIndex = clampIndex(
        Math.min(columnIndex + 1, limit),
        isHidden,
        direction
      );
      let value = getValue({ rowIndex, columnIndex });
      while (isNull(value) && columnIndex < limit) {
        columnIndex = clampIndex(
          Math.min(++columnIndex, limit),
          isHidden,
          direction
        );
        value = getValue({ rowIndex, columnIndex });
      }
      return { rowIndex, columnIndex };
    }

    case Direction.Left: {
      columnIndex = clampIndex(
        Math.max(columnIndex - 1, limit),
        isHidden,
        direction
      );
      let value = getValue({ rowIndex, columnIndex });
      while (isNull(value) && columnIndex > limit) {
        columnIndex = clampIndex(
          Math.max(--columnIndex, limit),
          isHidden,
          direction
        );
        value = getValue({ rowIndex, columnIndex });
      }
      return { rowIndex, columnIndex };
    }

    default:
      return activeCell;
  }
}

/**
 * Ex
 */
type ValueGetter = (cell: CellInterface) => string | undefined;
export function findNextCellInDataRegion(
  activeCell: CellInterface,
  getValue: ValueGetter,
  isHidden: HiddenType | undefined,
  direction: Direction,
  limit: number
): number {
  var { rowIndex, columnIndex } = activeCell;
  const isCurrentCellEmpty = isNull(getValue(activeCell));
  const didWeReachTheEdge = (cur: boolean, next: boolean): boolean => {
    return (cur && next) || (cur && !next) || (!cur && next);
  };
  switch (direction) {
    case Direction.Down: {
      const nextCellValue = getValue({ rowIndex: rowIndex + 1, columnIndex });
      const isNextCellEmpty = isNull(nextCellValue);
      const isEdge = didWeReachTheEdge(isCurrentCellEmpty, isNextCellEmpty);
      const nextCell = isEdge
        ? findNextContentfulCell(
            activeCell,
            getValue,
            isHidden,
            direction,
            limit
          )
        : findLastContentfulCell(
            activeCell,
            getValue,
            isHidden,
            direction,
            limit
          );
      return nextCell?.rowIndex;
    }

    case Direction.Up: {
      const nextCellValue = getValue({ rowIndex: rowIndex - 1, columnIndex });
      const isNextCellEmpty = isNull(nextCellValue);
      const isEdge = didWeReachTheEdge(isCurrentCellEmpty, isNextCellEmpty);
      const nextCell = isEdge
        ? findNextContentfulCell(
            activeCell,
            getValue,
            isHidden,
            direction,
            limit
          )
        : findLastContentfulCell(
            activeCell,
            getValue,
            isHidden,
            direction,
            limit
          );
      return nextCell?.rowIndex;
    }

    case Direction.Right: {
      const nextCellValue = getValue({
        rowIndex,
        columnIndex: columnIndex + 1,
      });
      const isNextCellEmpty = isNull(nextCellValue);
      const isEdge = didWeReachTheEdge(isCurrentCellEmpty, isNextCellEmpty);
      const nextCell = isEdge
        ? findNextContentfulCell(
            activeCell,
            getValue,
            isHidden,
            direction,
            limit
          )
        : findLastContentfulCell(
            activeCell,
            getValue,
            isHidden,
            direction,
            limit
          );
      return nextCell?.columnIndex;
    }

    case Direction.Left: {
      const nextCellValue = getValue({
        rowIndex,
        columnIndex: columnIndex - 1,
      });
      const isNextCellEmpty = isNull(nextCellValue);
      const isEdge = didWeReachTheEdge(isCurrentCellEmpty, isNextCellEmpty);
      const nextCell = isEdge
        ? findNextContentfulCell(
            activeCell,
            getValue,
            isHidden,
            direction,
            limit
          )
        : findLastContentfulCell(
            activeCell,
            getValue,
            isHidden,
            direction,
            limit
          );
      return nextCell?.columnIndex;
    }
  }
}

/**
 * Check if 2 areas overlap
 * @param area1
 * @param area2
 */
export function areaIntersects(area1: AreaProps, area2: AreaProps): boolean {
  if (area1.left > area2.right || area2.left > area1.right) {
    return false;
  }
  if (area1.top > area2.bottom || area2.top > area1.bottom) {
    return false;
  }
  return true;
}

/**
 * Cycles active cell within selecton bounds
 * @param activeCellBounds
 * @param selectionBounds
 * @param direction
 */
export function findNextCellWithinBounds(
  activeCellBounds: AreaProps,
  selectionBounds: AreaProps,
  direction: Direction = Direction.Right
): CellInterface | null {
  const intersects = areaIntersects(activeCellBounds, selectionBounds);
  if (!intersects) return null;
  let rowIndex, columnIndex;
  let nextActiveCell: CellInterface | null = null;
  if (direction === Direction.Right) {
    rowIndex = activeCellBounds.top;
    columnIndex = activeCellBounds.left + 1;
    if (columnIndex > selectionBounds.right) {
      rowIndex = rowIndex + 1;
      columnIndex = selectionBounds.left;
      if (rowIndex > selectionBounds.bottom) {
        rowIndex = selectionBounds.top;
      }
    }
    nextActiveCell = { rowIndex, columnIndex };
  }
  if (direction === Direction.Left) {
    rowIndex = activeCellBounds.bottom;
    columnIndex = activeCellBounds.left - 1;
    if (columnIndex < selectionBounds.left) {
      rowIndex = rowIndex - 1;
      columnIndex = selectionBounds.right;
      if (rowIndex < selectionBounds.top) {
        rowIndex = selectionBounds.bottom;
      }
    }
    nextActiveCell = { rowIndex, columnIndex };
  }

  if (direction === Direction.Down) {
    rowIndex = activeCellBounds.bottom + 1;
    columnIndex = activeCellBounds.left;
    if (rowIndex > selectionBounds.bottom) {
      columnIndex = activeCellBounds.left + 1;
      rowIndex = selectionBounds.top;
      if (columnIndex > selectionBounds.right) {
        columnIndex = selectionBounds.left;
      }
    }
    nextActiveCell = { rowIndex, columnIndex };
  }

  if (direction === Direction.Up) {
    rowIndex = activeCellBounds.top - 1;
    columnIndex = activeCellBounds.left;
    if (rowIndex < selectionBounds.top) {
      columnIndex = activeCellBounds.left - 1;
      rowIndex = selectionBounds.bottom;
      if (columnIndex < selectionBounds.left) {
        columnIndex = selectionBounds.right;
      }
    }
    nextActiveCell = { rowIndex, columnIndex };
  }

  return nextActiveCell;
}

/**
 * Check if its being rendered in Browser or SSR
 */
export const canUseDOM = !!(
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement
);

/**
 * Simple Canvas element to measure text size
 *
 * Usage
 *
 * ```
 * const textSizer = new AutoSizer()
 * textSizer.measureText('Hello world').width
 * ```
 */
interface AutoSizerProps {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: number;
  scale?: number;
}

type IOptions = {
  [key: string]: any;
};
export const AutoSizerCanvas = (defaults: AutoSizerProps = {}) => {
  const {
    fontFamily = "arial, sans, sans-serif",
    fontSize = 13,
    fontWeight = "",
    fontStyle = "",
    lineHeight = 16,
    scale = 1,
  } = defaults;
  var o: IOptions = {
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    lineHeight,
    scale,
  };
  const canvas =
    canUseDOM && <HTMLCanvasElement>document.createElement("canvas");
  const context = canvas ? canvas.getContext("2d") : null;

  const setFont = (options: IOptions = {}) => {
    for (const key in options) {
      o[key] = options[key] ?? o[key];
    }
    if (context) {
      context.font = `${o.fontStyle} ${o.fontWeight} ${
        o.fontSize * o.scale
      }px ${o.fontFamily}`;
    }
  };
  const getWidthOfLongestText = (text: string | undefined) => {
    let width = 0;
    let height = 0;
    if (text === void 0) return { width, height };
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineWidth = context?.measureText(line).width ?? 0;
      width = Math.max(width, lineWidth);
      height += o.fontSize * 1.2 * o.scale;
    }
    return { width: Math.ceil(width), height: Math.ceil(height) };
  };
  const measureText = (text: string) =>
    getWidthOfLongestText(castToString(text));
  const reset = () => setFont(defaults);
  /* Set font in constructor */
  setFont(o);

  return {
    context,
    measureText,
    setFont,
    reset,
  };
};

/**
 * Converts a value to string
 * @param value
 */
export const castToString = (value: any): string | undefined => {
  if (value === null || value === void 0) return void 0;
  return typeof value !== "string" ? "" + value : value;
};

export const selectionFromActiveCell = (
  activeCell: CellInterface | null
): SelectionArea[] => {
  if (!activeCell) return [];
  return [
    {
      bounds: {
        top: activeCell.rowIndex,
        left: activeCell.columnIndex,
        bottom: activeCell.rowIndex,
        right: activeCell.columnIndex,
      },
    },
  ];
};

/**
 * 将 selections 转换为 cell interface arr
 * @param selections
 */
export function flatSelectionsToCellInterfaceArr(
  selections: SelectionArea[]
): CellInterface[] {
  let cells: CellInterface[] = [];
  for (let i = 0; i < selections.length; i++) {
    const { bounds } = selections[i];
    for (let c = bounds.left; c <= bounds.right; c++) {
      let columnIndex = c;
      for (let r = bounds.top; r <= bounds.bottom; r++) {
        let rowIndex = r;
        //  去重
        if (
          cells.find(
            (cell) =>
              cell.rowIndex === rowIndex && cell.columnIndex === columnIndex
          )
        ) {
        } else {
          cells.push({
            rowIndex: rowIndex,
            columnIndex: columnIndex,
          });
        }
      }
    }
  }

  return cells;
}
