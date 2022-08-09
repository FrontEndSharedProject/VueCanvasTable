import { Align, ItemType, SortEnum } from "@/enums";
import { ShapeConfig } from "konva/lib/Shape";
import { HTMLAttributes } from "vue";

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
  enable:boolean;
  configs:ColumnGroupConfig[]
}
