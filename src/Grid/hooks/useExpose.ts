/**
 * 处理 ref 中的 defineExpose 中需要暴露的方法
 */
import { useStore } from "$vct/hooks/useStore";
import { unref } from "vue";
import { useDimensions } from "$vct/hooks/useDimensions";
import {
  AreaProps,
  CellInterface,
  OptionalScrollCoords,
  CellPosition,
  PosXYRequired,
  ScrollCoords,
  ContainerDimensionsType,
  SelectionArea,
  SortRowsConfig,
  Note,
  AreaBounds,
} from "$vct/types";
import { getOffsetForColumnAndAlignment } from "$vct/helpers";
import { Align, ItemType, MenuTypeEnum } from "$vct/enums";
import { useGlobalStore } from "$vct/store/global";
import { ScrollStateType } from "$vct/Grid/hooks/useScroll";
import { arrayElsPositionMove } from "$vct/utils";
import { Column, Row } from "$vct/Grid/types";
import { getDefaultNote } from "$vct/Grid/components/Notes/hooks/useNotes";

export type UseExposeReturnType = {
  getCellCoordsFromOffset(
    left: number,
    top: number,
    includeFrozen?: boolean
  ): CellInterface | null;
  scrollToItem(payload: Partial<CellInterface>): void;
  scrollTo({ scrollTop, scrollLeft }: OptionalScrollCoords);
  getCellBounds(payload: CellInterface): AreaProps;
  focusStageContainer(): void;
  getViewPort(): ScrollStateType;
  getCellOffsetFromCoords(cell: CellInterface): CellPosition;
  getScrollPosition(): ScrollCoords;
  getDimensions(): ContainerDimensionsType;
  setSelections(selections: SelectionArea[]): void;
  //  选中 column
  setColumnSelect(columnIndex: number): void;
  getRelativePositionFromOffset(
    left: number,
    top: number
  ): PosXYRequired | null;
  setColumnsWidthById(config: Record<string, number>): void;
  setColumnsWidthByIndex(config: Record<number, number>): void;
  setColumnsPosition(startAt: number, length: number, destAt: number): void;
  forceUpdateUi(): void;
  //  多列排序
  sortRowConfigs(sortConfig: SortRowsConfig[], isQuicklySort?: boolean): void;
  //  添加一个单列排序规则
  addSortRowConfig(
    field: SortRowsConfig["field"],
    mode: SortRowsConfig["mode"],
    isQuicklySort?: boolean
  ): void;
  changeSortRowMode(
    field: SortRowsConfig["field"],
    mode: SortRowsConfig["mode"],
    isQuicklySort?: boolean
  );
  setRowsData(rows: Row[]): void;
  hiddenColumnByIndex(colIndex: number): void;
  setFrozenColumnByIndex(colIndex: number): void;
  cancelFrozenColumn(): void;
  isReadonlyColumn(colIndex: number): boolean;
  isReadonlyRow(rowIndex: number): boolean;
  isReadonlyCell(cell: CellInterface): boolean;
  isCellExists(coord: CellInterface): boolean;
  getRowOffset(index: number, pure?: boolean): number;
  getColumnOffset(index: number): number | -1;
  getRowHeight(index: number): number;
  getColumnWidth(index: number): number;
  /**
   * 获取 cell 值
   * @param coord
   * @param originalValue 是否获取原数据（未经过 DataTransformer 转换的数据）
   */
  getCellValueByCoord(coord: CellInterface, originalValue?: boolean): string;
  /**
   *
   * @param cell
   * @param value
   * @param force 无视 readonly 强制更新
   * @param skipColumnDataTransformer 是否跳过 DataTransformer 数据转换
   */
  setCellValueByCoord(
    cell: CellInterface,
    value: string,
    force?: boolean,
    skipColumnDataTransformer?: boolean
  ): void;
  getColumnByColIndex(colIndex: number): Column;
  deleteCellValue(cell: CellInterface): void;
  isHiddenColumn(colIndex: number): boolean;
  isHiddenRow(rowIndex: number): boolean;
  getColumnByFieldId(fieldId: string): Column | null;
  getRowByRowId(rowId: string): Row | null;
  getRowByIndex(rowIndex: number): Row | null;
  //  检测 鼠标位置是否在 rowHeader 上
  isMouseInRowHeader(clientX: number, clientY: number): boolean;
  //  检测 鼠标位置是否在 columHeader 上
  isMouseInColumnHeader(clientX: number, clientY: number): boolean;
  //  检测 鼠标位置是否在 cell 上
  isMouseInCells(clientX: number, clientY: number): boolean;
  //  将所有的 rows 设置为选中状态，左上角的复选框用
  selectAllRows(): void;
  //  选中 rows
  setRowsSelect(indexs: number[]): void;
  isHaveNote(coord: CellInterface): boolean;
  getNote(coord: CellInterface): Note | null;
  updateNote(note: Partial<Note>);
  addNote(note: Pick<Note, "rowId" | "colId" | "note">);
  showNoteByCoord(coord: CellInterface);
  deleteNote(noteIds: Pick<Note, "rowId" | "colId">);
  getColumnStartIndexForOffset(offset: number): number;
  getColumnStopIndexForStartIndex(startIndex: number): number;
  getRowStartIndexForOffset(offset: number): number;
  getRowStopIndexForStartIndex(startIndex: number): number;
  getColumnDataTransformer(
    columnIndex: number,
    methods: "formatValueFromData" | "parseValueToData" | "parseFromClipboard",
    value: any
  ): any;
};

let cache: UseExposeReturnType | null = null;

export function useExpose(): UseExposeReturnType {
  if (cache) return cache;

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
    columns,
    columnCount,
    rows,
    rowCount,
    rowAreaBounds,
    columnAreaBounds,
    hiddenColumns,
    hiddenRows,
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
    width,
    height,
  } = useDimensions();

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
      left = left - rect.x - unref(rowHeaderWidth);
      top = top - rect.y;
    }
    const { x, y } = stage
      .getAbsoluteTransform()
      .copy()
      .invert()
      .point({ x: left, y: top });

    return { x, y };
  }

  function getDimensions(): ContainerDimensionsType {
    return {
      containerWidth: stageWidth.value,
      containerHeight: stageHeight.value,
      estimatedTotalWidth: contentWidth.value,
      estimatedTotalHeight: contentHeight.value,
    };
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

  /**
   * 获取 cell 的 offset 通过 rowIndex 和 colIndex
   * @param cell
   */
  function getCellOffsetFromCoords(cell: CellInterface): CellPosition {
    const {
      top: rowIndex,
      left: columnIndex,
      right,
      bottom,
    } = getCellBounds(cell);
    const x = getColumnOffset(columnIndex) + rowHeaderWidth.value;
    const y = getRowOffset(rowIndex);
    const width = getColumnOffset(right + 1) - getColumnOffset(columnIndex);
    const height = getRowOffset(bottom + 1) - y;

    return {
      x,
      y,
      width,
      height,
    };
  }

  /**
   * 获取当前滚动条位置
   */
  function getScrollPosition(): ScrollCoords {
    return {
      scrollTop: scrollState.value.scrollTop,
      scrollLeft: scrollState.value.scrollLeft,
    };
  }

  function focusStageContainer(): void {
    if (document.activeElement !== unref(stageContainerRef)) {
      return stageContainerRef.value?.focus();
    }
  }

  function getViewPort(): ScrollStateType {
    return unref(scrollState);
  }

  function setSelections(selections: SelectionArea[]) {
    globalStore.selections = selections;
  }

  function setColumnSelect(columnIndex: number) {
    if (columnIndex < columnCount.value - 1) {
      globalStore.selectedColumns = [columnIndex];
    }
  }

  function setColumnsWidthById(config: Record<string, number>) {
    globalStore.colWidths = Object.assign(globalStore.colWidths, config);
  }

  function setColumnsWidthByIndex(config: Record<string, number>) {
    let indexConfigs: Record<number, number> = {};

    Object.keys(config).map((colIndex) => {
      const column = columns.value[colIndex];
      indexConfigs[column.id] = config[colIndex];
    });

    setColumnsWidthById(indexConfigs);
  }

  /**
   * 修改 column 的位置
   * @param startAt 开始的位置
   * @param length 需要移动的元素长度
   * @param destAt 需要放置的位置
   */
  function setColumnsPosition(startAt: number, length: number, destAt: number) {
    let idsArr = globalStore._columns.map((c) => c.id);
    idsArr = arrayElsPositionMove(idsArr, startAt, length, destAt);

    globalStore._columns.map((c) => {
      c.order = idsArr.indexOf(c.id);
    });

    forceUpdateUi();
  }

  /**
   * 强制更新 ui
   */
  function forceUpdateUi() {
    return;
    globalStore._UiForceUpdateRandom = Math.random();
  }

  /**
   * 快速排序多条规则
   * @param sortConfig
   * @param isQuicklySort
   */
  function sortRowConfigs(
    sortConfig: SortRowsConfig[],
    isQuicklySort: boolean = true
  ): void {
    globalStore.sortRowConfigs = sortConfig;

    if (!isQuicklySort) {
      //  todo 触发排序更新接口
    }
  }

  /**
   * 快速排序单条规则
   * @param field
   * @param mode
   * @param isQuicklySort
   */
  function addSortRowConfig(
    field: SortRowsConfig["field"],
    mode: SortRowsConfig["mode"],
    isQuicklySort?: boolean
  ): void {
    globalStore.sortRowConfigs.push({ field, mode });

    if (!isQuicklySort) {
      //  todo 触发排序更新接口
    }
  }

  /**
   * 设置快速排序规则
   * @param field
   * @param mode
   * @param isQuicklySort
   */
  function changeSortRowMode(
    field: SortRowsConfig["field"],
    mode: SortRowsConfig["mode"],
    isQuicklySort?: boolean
  ) {
    const config = globalStore.sortRowConfigs.find((c) => c.field === field);
    if (config) {
      config.mode = mode;
      if (!isQuicklySort) {
        //  todo 触发排序更新接口
      }
    } else {
      addSortRowConfig(field, mode, isQuicklySort);
    }

    forceUpdateUi();
  }

  function setRowsData(rows: Row[]) {
    globalStore._rows = rows;
    forceUpdateUi();
  }

  function hiddenColumnByIndex(colIndex: number) {
    const column = getColumnByColIndex(colIndex);
    if (column && !globalStore.hiddenColumns.includes(column.id)) {
      globalStore.hiddenColumns.push(column.id);
    }
  }

  function setFrozenColumnByIndex(colIndex: number) {
    if (colIndex > rowCount.value - 1) return;
    let offset = getColumnOffset(colIndex);
    let width = getColumnWidth(colIndex);

    if (offset + width > stageWidth.value - 50) {
      //  todo 提示功能
      return;
    }

    globalStore.frozenColumns = colIndex + 1;
    forceUpdateUi();
  }

  function cancelFrozenColumn() {
    globalStore.frozenColumns = 0;
    //  todo 触发更新
  }

  function isReadonlyColumn(colIndex: number): boolean {
    return columns.value[colIndex] ? columns.value[colIndex].readonly : false;
  }

  function isReadonlyRow(rowIndex: number): boolean {
    return rows.value[rowIndex] ? rows.value[rowIndex].readonly : false;
  }

  function isReadonlyCell(coord: CellInterface): boolean {
    return isReadonlyColumn(coord.columnIndex) || isReadonlyRow(coord.rowIndex);
  }

  function isCellExists(coord: CellInterface): boolean {
    if (coord.rowIndex > rowCount.value - 1) return false;
    if (coord.columnIndex > columnCount.value - 1) return false;
    return true;
  }

  function getRowOffset(index: number, pure: boolean = false): number {
    return rowAreaBounds.value[index].top;
  }

  function getColumnOffset(index: number): number | -1 {
    if (!columnAreaBounds.value[index]) return -1;
    return columnAreaBounds.value[index].left;
  }

  function getRowHeight(index) {
    return rowAreaBounds.value[index].bottom - rowAreaBounds.value[index].top;
  }

  function getColumnWidth(index) {
    return (
      columnAreaBounds.value[index].right - columnAreaBounds.value[index].left
    );
  }

  function getColumnByColIndex(colIndex: number): Column {
    return columns.value[colIndex];
  }

  function getCellValueByCoord(
    coord: CellInterface,
    originalValue: boolean = false
  ): any {
    const column = getColumnByColIndex(coord.columnIndex);

    if (originalValue) {
      return rows.value[coord.rowIndex][column.id];
    } else {
      return getColumnDataTransformer(
        coord.columnIndex,
        "formatValueFromData",
        rows.value[coord.rowIndex][column.id]
      );
    }
  }

  function setCellValueByCoord(
    coord: CellInterface,
    value,
    force: boolean = false,
    skipColumnDataTransformer: boolean = false
  ) {
    if (isReadonlyCell(coord) && !force) {
      return;
    }
    const column = getColumnByColIndex(coord.columnIndex);
    rows.value[coord.rowIndex][column.id] = skipColumnDataTransformer
      ? value
      : getColumnDataTransformer(coord.columnIndex, "parseValueToData", value);
  }

  function isHiddenColumn(index: number): boolean {
    const column = columns.value[index];
    if (column) {
      return !!~hiddenColumns.value.indexOf(column.id);
    }
    return true;
  }

  function isHiddenRow(index: number): boolean {
    const row = rows.value[index];
    if (row) {
      return !!~hiddenRows.value.indexOf(row.id);
    }

    return true;
  }

  function getColumnByFieldId(fieldId: string): Column | null {
    const column = columns.value.find((c) => c.id === fieldId);
    return column ? column : null;
  }

  function getRowByRowId(rowId: string): Row | null {
    const row = rows.value.find((r) => r.id === rowId);
    return row ? row : null;
  }

  function getRowByIndex(rowIndex: number): Row | null {
    const row = rows.value[rowIndex];
    return row ? row : null;
  }

  function deleteCellValue(cell: CellInterface): void {
    const column = getColumnByColIndex(cell.columnIndex);
    rows.value[cell.rowIndex][column.id] = "";
  }

  function isMouseInRowHeader(clientX: number, clientY: number): boolean {
    if (!stageContainerRef.value) return false;

    const {
      left: sLeft,
      top: sTop,
      height: sHeight,
    } = stageContainerRef.value.getBoundingClientRect();

    const isXInRowHeader =
      clientX > sLeft && clientX < sLeft + rowHeaderWidth.value;
    const isYInRowHeader = clientY > sTop && clientY < sTop + sHeight;

    return isXInRowHeader && isYInRowHeader;
  }

  function isMouseInColumnHeader(clientX: number, clientY: number): boolean {
    if (!stageContainerRef.value) return false;

    const {
      left: sLeft,
      top: sTop,
      width: sWidth,
    } = stageContainerRef.value.getBoundingClientRect();

    const isXInColumnHeader = clientX > sLeft && clientX < sLeft + sWidth;
    const isYInROwHeader =
      clientY > sTop - columnHeight.value && clientY < sTop;

    return isXInColumnHeader && isYInROwHeader;
  }

  function isMouseInCells(clientX: number, clientY: number): boolean {
    if (!stageContainerRef.value) return false;
    const {
      left: sLeft,
      top: sTop,
      width: sWidth,
      height: sHeight,
    } = stageContainerRef.value.getBoundingClientRect();

    const isXInCellHeader =
      clientX > sLeft + rowHeaderWidth.value && clientX < sLeft + sWidth;
    const isYInCellHeader = clientY > sTop && clientY < sTop + sHeight;

    return isXInCellHeader && isYInCellHeader;
  }

  function selectAllRows() {
    globalStore.selectedRows = rows.value.map((r, index) => index);
  }

  function setRowsSelect(indexs: number[]): void {
    globalStore.selectedRows = indexs;
  }

  function isHaveNote(coord: CellInterface): boolean {
    const column = getColumnByColIndex(coord.columnIndex);
    const row = getRowByIndex(coord.rowIndex);
    if (!row || !column) return false;
    return !!globalStore.notes.find(
      (n) => n.rowId === row.id && n.colId === column.id
    );
  }

  function getNote(coord: CellInterface): Note | null {
    const column = getColumnByColIndex(coord.columnIndex);
    const row = getRowByIndex(coord.rowIndex);
    if (!row || !column) return null;
    return (
      globalStore.notes.find(
        (n) => n.rowId === row.id && n.colId === column.id
      ) ?? null
    );
  }

  function updateNote(note: Partial<Note>) {
    const targetNote = globalStore.notes.find(
      (n) => n.rowId === note.rowId && n.colId === note.colId
    );

    if (targetNote) {
      Object.assign(targetNote, note);
    } else {
      //  @ts-ignore
      addNote(note);
    }
  }

  function addNote(note: Pick<Note, "rowId" | "colId" | "note">) {
    const targetNote = globalStore.notes.find(
      (n) => n.rowId === note.rowId && n.colId === note.colId
    );

    if (!targetNote) {
      let newNote = getDefaultNote();
      newNote = Object.assign(newNote, note) as Note;
      //  @ts-ignore
      globalStore.notes.push(newNote);
    } else {
      updateNote(note);
    }
  }

  function showNoteByCoord(coord: CellInterface) {
    const column = getColumnByColIndex(coord.columnIndex);
    const row = getRowByIndex(coord.rowIndex);
    if (!row || !column) return;
    if (!isHaveNote(coord)) {
      addNote({
        rowId: row.id,
        colId: column.id,
        note: "",
      });
    }

    globalStore._showNoteWatcher = {
      rowIndex: coord.rowIndex,
      columnIndex: coord.columnIndex,
    };
  }

  function deleteNote(noteIds: Pick<Note, "rowId" | "colId">) {
    const targetNote = globalStore.notes.find(
      (n) => n.rowId === noteIds.rowId && n.colId === noteIds.colId
    );

    if (targetNote) {
      let index = globalStore.notes.indexOf(targetNote);
      globalStore.notes.splice(index, 1);
    }
  }

  function getColumnStartIndexForOffset(offset: number): number {
    const columnAreaBounds = globalStore.columnAreaBounds as AreaBounds[];
    let index = 0;
    let currentOffset = columnAreaBounds[index].right;

    while (index < columnAreaBounds.length - 1 && offset > currentOffset) {
      index++;
      currentOffset = columnAreaBounds[index].right;
    }

    return index;
  }

  function getColumnStopIndexForStartIndex(startIndex: number): number {
    const columnAreaBounds = globalStore.columnAreaBounds as AreaBounds[];
    let currentOffset = globalStore.scrollState.scrollLeft;
    let maxOffset = currentOffset + width.value;
    let index = startIndex;

    while (index < columnAreaBounds.length - 1 && maxOffset > currentOffset) {
      index++;
      currentOffset = columnAreaBounds[index].right;
    }

    return index;
  }

  function getRowStartIndexForOffset(offset: number): number {
    const rowAreaBounds = globalStore.rowAreaBounds as AreaBounds[];
    let index = 0;
    let currentOffset = rowAreaBounds[index].bottom;

    while (index < rowAreaBounds.length - 1 && offset > currentOffset) {
      index++;
      currentOffset = rowAreaBounds[index].bottom;
    }

    return index;
  }

  function getRowStopIndexForStartIndex(startIndex: number): number {
    const rowAreaBounds = globalStore.rowAreaBounds as AreaBounds[];
    let currentOffset = rowAreaBounds[startIndex].top;
    let maxOffset = currentOffset + height.value - globalStore.columnHeight;
    let index = startIndex;

    while (index < rowAreaBounds.length - 1 && maxOffset > currentOffset) {
      index++;
      currentOffset = rowAreaBounds[index].bottom;
    }

    return index;
  }

  //  使用 column 中的 DataTransformer
  function getColumnDataTransformer(
    columnIndex: number,
    methods: "formatValueFromData" | "parseValueToData" | "parseFromClipboard",
    value: any
  ): any {
    const column = getColumnByColIndex(columnIndex);
    if (!column) return value;
    if (!column.dataTransformer) return value;
    return column.dataTransformer[methods](value, column.properties, column);
  }

  cache = {
    getCellCoordsFromOffset,
    scrollToItem,
    scrollTo,
    getCellBounds,
    focusStageContainer,
    getViewPort,
    getCellOffsetFromCoords,
    getScrollPosition,
    getDimensions,
    setSelections,
    setColumnSelect,
    getRelativePositionFromOffset,
    setColumnsWidthById,
    setColumnsWidthByIndex,
    setColumnsPosition,
    forceUpdateUi,
    addSortRowConfig,
    sortRowConfigs,
    setRowsData,
    hiddenColumnByIndex,
    setFrozenColumnByIndex,
    cancelFrozenColumn,
    changeSortRowMode,
    isReadonlyColumn,
    isReadonlyRow,
    isReadonlyCell,
    isCellExists,
    getRowOffset,
    getColumnOffset,
    getRowHeight,
    getColumnWidth,
    getCellValueByCoord,
    getColumnByColIndex,
    setCellValueByCoord,
    isHiddenColumn,
    isHiddenRow,
    getColumnByFieldId,
    getRowByRowId,
    getRowByIndex,
    deleteCellValue,
    isMouseInRowHeader,
    isMouseInColumnHeader,
    isMouseInCells,
    selectAllRows,
    setRowsSelect,
    isHaveNote,
    getNote,
    updateNote,
    addNote,
    showNoteByCoord,
    deleteNote,
    getColumnStartIndexForOffset,
    getColumnStopIndexForStartIndex,
    getRowStartIndexForOffset,
    getRowStopIndexForStartIndex,
    getColumnDataTransformer,
  };

  return cache;
}
