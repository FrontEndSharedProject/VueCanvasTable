import { VNode } from "vue";
import { CellInterface, DataVerification, SelectionArea } from "$vct/types";
import { DataTransformer } from "$vct/Columns/DataTransformer";

export type Column = {
  id: string;
  field: string;
  properties: Record<string, any>;
  readonly: boolean;
  cellRenderer?: VNode;
  cellEditor?: VNode;
  cellSorter?: (left: Row, right: Row, field: string, column: Column) => number;
  cellFilter?: (row: Row, value: string, column: Column) => boolean;
  cellTooltiper?: VNode;
  dataTransformer?: DataTransformer;
  dataVerification?: DataVerification;
  icon: string;
  order: number;
  [key: string]: any;
};

export type Row = {
  id: string;
  readonly: boolean;
  order: number;
  [key: string]: any;
};

export interface ThemesConfig {
  //  主色
  main: string;
  //  文本主色
  textColor: string;
  //  文本二级颜色
  textColor2: string;
  //  警告颜色
  dangerColor: string;
  //  线框颜色
  lineColor: string;
  //  圆角
  borderRadius: string;
  //  cell 表格中的 box shadow cellEditor 和 cellTooltip 用到
  cellBoxShadow: string;
  //  column 背景色
  columnHeaderBackgroundColor: string;
  //  column 选中背景色
  columnHeaderBackgroundSelected: string;
  //  column hover 背景色
  columnHeaderBackgroundHover: string;
  //  column drag 背景色
  columnHeaderBackgroundDrag: string;
  //  ul>li hover 颜色
  menuListItemHoverColor: string;
  //  scrollbar thumb 颜色
  scrollbarThumbBackground: string;
  //  row hover 颜色
  rowHoverBackground: string;
}

export type ContextMenuRenderProps = {
  rows: Row[];
  columns: Column[];
  cells: Array<{ value: string } & CellInterface>;
  values: string[][];
  selections: SelectionArea[];
  rowIds: string[];
  columnIds: string[];
  startColumnIndex: number;
  endColumnIndex: number;
  startRowIndex: number;
  endRowIndex: number;
  close(): void;
};

export type ContextMenuItem =
  | {
      title: string | VNode;
      icon: string;
      hide?: boolean;
      danger?: boolean;
      action(): void;
    }
  | {
      separator: true;
    };
