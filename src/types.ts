import {
  Align,
  Direction,
  FilterNextEnum,
  ItemType,
  PositionEnum,
  SortEnum,
  StatisticsType,
} from "$vct/enums";
import { HTMLAttributes } from "vue";
import { Column, Row } from "$vct/Grid/types";
import type { UseExposeReturnType } from "$vct/Grid/hooks/useExpose";
import type Konva from "konva";

export type VueCanvasTableMethodsType = UseExposeReturnType;

export type ShapeConfig = Konva.ShapeConfig;

export interface AreaProps {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PosXYRequired {
  x: number;
  y: number;
}

export interface CellInterface {
  rowIndex: number;
  columnIndex: number;
}

export interface CellPosition
  extends Pick<ShapeConfig, "x" | "y" | "width" | "height"> {}

export type ScrollCoords = {
  scrollTop: number;
  scrollLeft: number;
};

export interface AreaMeta {
  title?: string;
  [key: string]: any;
}

export interface Style {
  stroke?: string;
  strokeLeftColor?: string;
  strokeTopColor?: string;
  strokeRightColor?: string;
  strokeBottomColor?: string;
  strokeWidth?: number;
  strokeTopWidth?: number;
  strokeRightWidth?: number;
  strokeBottomWidth?: number;
  strokeLeftWidth?: number;
  strokeStyle?: string;
}

export interface AreaStyle extends AreaMeta {
  bounds: AreaProps;
  style?: Style;
  strokeStyle?: "dashed" | "solid" | "dotted";
}

export interface SelectionArea extends AreaStyle {
  bounds: AreaProps;
  inProgress?: boolean;
  /**
   * When user drags the fill handle
   */
  isFilling?: boolean;
}

export interface AreaProps {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export type OptionalScrollCoords = {
  scrollTop?: number;
  scrollLeft?: number;
};

export type ContainerDimensionsType = {
  containerWidth: number;
  containerHeight: number;
  estimatedTotalWidth: number;
  estimatedTotalHeight: number;
};

export interface SelectionProps
  extends AreaMeta,
    ShapeConfig,
    Omit<HTMLAttributes, "draggable"> {
  fillHandleProps?: Record<string, (e: any) => void>;
  type: "fill" | "activeCell" | "selection" | "border";
  isDragging?: boolean;
  inProgress?: boolean;
  activeCell?: CellInterface;
  selection?: SelectionArea;
  key: number;
  draggable?: boolean;
  bounds?: AreaProps;
  borderCoverWidth?: number;
}

export type RowHeaderProps = {
  hover: boolean;
  index: number;
  x: number;
  y: number;
  height: number;
  width: number;
};

export type ColumnGroupConfig = {
  column: string;
  sort: SortEnum.ASC;
};

export type ColumnGroupConfigProps = {
  enable: boolean;
  configs: ColumnGroupConfig[];
};

//  数据验证类型
export type DataVerification = {
  pattern: string;
  errorMessage: string;
}[];

export interface CellEditorProps {
  /**
   * Currently selected bounds, useful for fomulas
   */
  selections?: SelectionArea[];
  /**
   * Initial value of the cell
   */
  value?: string;
  /**
   * Callback when a value has changed.
   */
  onChange?: (value: string, activeCell: CellInterface) => void;
  /**
   * Callback to submit the value back to data store
   */
  onSubmit?: (
    value: string,
    activeCell: CellInterface,
    nextActiveCell?: CellInterface | null
  ) => void;
  /**
   * un focus event
   * @param e
   */
  onBlur?: (e: FocusEvent) => void;
  /**
   * On Cancel callbacks. Hides the editor
   */
  onCancel?: (e?: KeyboardEvent) => void;
  /**
   * Cell position, x, y, width and height
   */
  position: CellPosition;
  /**
   * Currently active cell, based on selection
   */
  activeCell: CellInterface;
  /**
   * Currrently edited cell
   */
  cell: CellInterface;
  /**
   * Scroll position of the grid
   */
  scrollPosition: ScrollCoords;
  //  cell width
  width: number;
  //  cell height
  height: number;
  /**
   * Next cell that should receive focus
   */
  nextFocusableCell?: (
    activeCell: CellInterface,
    direction?: Direction
  ) => CellInterface | null;
  /**
   * Autofocus the editor when open
   */
  autoFocus?: boolean;
  /**
   * On keydown event
   */
  onKeyDown?: (e: KeyboardEvent) => void;
  /**
   * Max editor width
   */
  maxWidth?: string | number;
  /**
   * Max editor height
   */
  maxHeight?: string | number;
  /**
   * Indicates if the cell is part of frozen row
   */
  isFrozenRow?: boolean;
  /**
   * Indicates if the cell is part of frozen column
   */
  isFrozenColumn?: boolean;
  /**
   * Frozen row offset
   */
  frozenRowOffset?: number;
  /**
   * Frozen column offset
   */
  frozenColumnOffset?: number;
}

export type AreaBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type SortRowsConfig = {
  field: string;
  mode: "asc" | "desc";
};

export type FilterRowsConfig = {
  field: string;
  value: any;
  next: FilterNextEnum;
  payload: any;
};

export interface CellTooltiperProps extends CellInterface {
  value: any;
  row: Row;
  column: Column;
  hide(): void;
  //  设置父级的属性
  setParentAttr(key: "zIndex" | "position", value: number | PositionEnum): void;
  //  重新计算溢出位置
  edgeAdjustment(): void;
}

export type Note = {
  rowId: string;
  colId: string;
  width: number;
  height: number;
  note: string;
};

export type StatisticsUpdatePayloadItem = {
  id: Column["id"];
  column: Column;
  width: number;
  isFrozen: boolean;
  isHidden: boolean;
  type: StatisticsType;
  value: string;
};

/**
 * 统计信息更新的数据
 */
export type StatisticsUpdatePayload = Array<StatisticsUpdatePayloadItem>;
