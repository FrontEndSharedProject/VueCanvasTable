export enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}

export enum Align {
  start = "start",
  end = "end",
  center = "center",
  auto = "auto",
  smart = "smart",
}

export enum MimeType {
  html = "text/html",
  csv = "text/csv",
  plain = "text/plain",
  json = "application/json",
}

export enum MouseButtonCodes {
  "left" = 1,
  "middle" = 2,
  "right" = 3,
}

export enum KeyCodes {
  Right = 39,
  Left = 37,
  Up = 38,
  Down = 40,
  Escape = 27,
  Tab = 9,
  Meta = 91,
  Delete = 46,
  BackSpace = 8,
  Enter = 13,
  A = 65,
  SPACE = 32,
  ALT = 18,
  C = 67,
  Home = 36,
  End = 35,
  PageDown = 34,
  PageUp = 33,
  Z = 90,
  CapsLock = 20,
  KEY_B = 66,
  KEY_I = 73,
  KEY_U = 85,
  KEY_X = 88,
  KEY_L = 76,
  KEY_E = 69,
  KEY_R = 82,
  BACK_SLASH = 220,
  KEY_Y = 89,
  ScrollLock = 145,
  NumLock = 144,
  Pause = 19,
  Insert = 45,
  Shift = 16,
  F1 = 112,
  F2 = 113,
  F3 = 114,
  F4 = 115,
  F5 = 116,
  F6 = 117,
  F7 = 118,
  F8 = 119,
  F9 = 120,
  F10 = 121,
  F11 = 122,
  F12 = 123,
}

export enum ItemType {
  row = "row",
  column = "column",
}

export enum SortEnum {
  ASC = "asc",
  DESC = "desc",
}

export enum FilterNextEnum {
  AND,
  OR,
}

export enum PositionEnum {
  LEFT = "left",
  RIGHT = "right",
  BOTTOM = "bottom",
  TOP = "top",
}

export enum MenuTypeEnum {
  CELL,
  COLUMN,
  ROW,
}

export enum ClassNameEnum {
  //  root 元素
  TABLE_WRAP = "vue-canvas-table",
  //  cell tooltip 悬浮框
  CELL_TOOLTIP_WRAP = "cell-tooltip-overlay-wrap",
  //  context menu
  CONTEXTMENU_WRAP = "context-menu-wrap",
  //  cell notes
  CELL_NOTES_WRAP = "cell-notes-wrap",
}

export enum StatisticsType {
  DISABLED,
  HAVE_VALUE,
  EMPTY,
  SUM,
  AVERAGE,
  MAX,
  MIN,
}

export enum EventName {
  CELL_VALUE_UPDATE = "CellValueUpdated",
  CELL_NOTE_UPDATE = "CellNoteUpdate",
  CELL_NOTE_DELETED = "CellNoteDeleted",
  STATISTICS_UPDATE = "StatisticsUpdate",
  STATISTICS_SELECTION_UPDATE = "StatisticsSelectionUpdate",
  FROZEN_COLUMNS_CHANGE = "FrozenColumnsChange",
  COLUMN_WIDTH_CHANGE = "ColumnWidthChange",
  COLUMNS_POSITION_SORT = "ColumnsPositionChange"
}
