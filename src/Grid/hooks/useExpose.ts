/**
 * 处理 ref 中的 defineExpose 中需要暴露的方法
 */
import { useStore } from "$vct/hooks/useStore";
import { onBeforeUnmount, unref } from "vue";
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
import {
  flatSelectionsToCellInterfaceArr,
  getOffsetForColumnAndAlignment,
  selectionFromActiveCell,
} from "$vct/helpers";
import { EventName, ItemType } from "$vct/enums";
import { State, useGlobalStore } from "$vct/store/global";
import { ScrollStateType } from "$vct/Grid/hooks/useScroll";
import { arrayElsPositionMove } from "$vct/utils";
import { Column, Row } from "$vct/Grid/types";
import { getDefaultNote } from "$vct/Grid/components/Notes/hooks/useNotes";
import Konva from "konva";
import {
  EventBaseReturnType,
  EventPayloadType,
  EventTypes,
  useEventBase,
} from "$vct/Grid/hooks/useEventBase";
import { useDataVerification } from "$vct/Grid/hooks/useDataVerification";
import EventEmitter from "eventemitter3";
import { cloneDeep } from "lodash-es";
import { useSensitiveOperation } from "$vct/hooks/useSensitiveOperation";

export type UseExposeReturnType = EventBaseReturnType & {
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
  getSelections(): SelectionArea[];
  //  选中 column
  setColumnSelect(columnIndex: number): void;
  getRelativePositionFromOffset(
    left: number,
    top: number
  ): PosXYRequired | null;
  setColumnsWidthById(config: Record<string, number>, silent?: boolean): void;
  setColumnsWidthByIndex(
    config: Record<number, number>,
    silent?: boolean
  ): void;
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
  hiddenColumnByIndexes(colIndexes: number[]): void;
  setFrozenColumnByIndex(colIndex: number, silent?: boolean): void;
  cancelFrozenColumn(): void;
  isReadonlyColumn(colIndex: number): boolean;
  isReadonlyRow(rowIndex: number): boolean;
  isReadonlyCell(cell: CellInterface): boolean;
  isCellExists(coord: CellInterface): boolean;
  getRowOffset(index: number, pure?: boolean): number;
  getColumnOffset(index: number): number | -1;
  getRowHeight(index: number): number;
  getColumnWidth(index: number): number;
  getColumns(): Column[];
  getRows(): Row[];
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
    options?: {
      force?: boolean;
      skipColumnDataTransformer?: boolean;
      silent?: false; //  如果为 true 时，不会触发 CellValueUpdated 事件
    }
  ): void;
  setCellValueById(rowId: string, colId: string, value, options): void;
  getColumnByColIndex(colIndex: number): Column;
  getColumnIndexByColId(colId: string): number;
  deleteCellValue(cell: CellInterface, force?: boolean): void;
  deleteCellsBySelection(selections?: SelectionArea[]): void;
  isHiddenColumn(colIndex: number): boolean;
  isHiddenRow(rowIndex: number): boolean;
  getColumnByFieldId(fieldId: string): Column | null;
  getRowByRowId(rowId: string): Row | null;
  getRowByIndex(rowIndex: number): Row | null;
  getRowIndexByRowId(rowId: string): number;
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
  getSelectRows(): number[];
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
  getStageInstance(): Konva.Stage | null;
  //  复制当前选区
  copyLastSelections(): void;
  //  将 clipboard 的内容粘贴到当前选区
  pasteFromClipboard(): void;
  showLoading(): void;
  hideLoading(): void;
  /**
   * 插入行
   * @param startIndex 从哪里开始插入
   * @param rows
   * @param isAbove
   */
  insertRows(startIndex: number, rows: Row[], isAbove?: boolean): void;
  deleteRows(rowsId: string[]);
  deleteColumnsById(colsId: string[]);
  getRowCount(): number;
  //  更新 config
  updateConfig(key: keyof State, value: any): void;
  getConfig(key: string): any;
  isRowExisted(rowIndex): boolean;
  getFrozenColumnIndex(): number;
  checkIsSensitiveOperate(count: number): Promise<boolean>;
};

let cache: UseExposeReturnType | null = null;

export function useExpose(): UseExposeReturnType {
  if (cache) return cache;

  const globalStore = useGlobalStore();
  const { verify } = useDataVerification();
  const eventBaseMethods = useEventBase();
  const { showConfirm } = useSensitiveOperation();

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

    let maxRowOffset =
      rowAreaBounds.value.length > 0
        ? rowAreaBounds.value[rowAreaBounds.value.length - 1].bottom
        : 0;
    //  如果点击在 addNewRow 区域的话也返回 null
    if (rowOffset > maxRowOffset) {
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

  function getSelections(): SelectionArea[] {
    return globalStore.selections;
  }

  function setColumnSelect(columnIndex: number) {
    if (columnIndex < columnCount.value - 1) {
      globalStore.selectedColumns = [columnIndex];
    }
  }

  function setColumnsWidthById(
    config: Record<string, number>,
    silent: boolean = false
  ) {
    globalStore.colWidths = Object.assign(globalStore.colWidths, config);

    !silent &&
      eventBaseMethods.emit(
        EventName.COLUMN_WIDTH_CHANGE,
        cloneDeep(globalStore.colWidths)
      );
  }

  function setColumnsWidthByIndex(
    config: Record<string, number>,
    silent: boolean = false
  ) {
    let indexConfigs: Record<number, number> = {};

    Object.keys(config).map((colIndex) => {
      const column = columns.value[colIndex];
      indexConfigs[column.id] = config[colIndex];
    });

    setColumnsWidthById(indexConfigs, silent);
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

    eventBaseMethods.emit(EventName.COLUMNS_POSITION_SORT, idsArr);

    forceUpdateUi();
  }

  /**
   * 强制更新 ui
   */
  function forceUpdateUi() {
    return;
    setTimeout(() => {
      globalStore._UiForceUpdateRandom = Math.random();
    }, 100);
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

    //  如果只 frozen colum 内部，则调整 index
    if (colIndex < globalStore.frozenColumns) {
      // cancelFrozenColumn()
      // setFrozenColumnByIndex(globalStore.frozenColumns - 2);
    }
  }

  function hiddenColumnByIndexes(colIndexes: number[]) {
    colIndexes.map((index) => {
      hiddenColumnByIndex(index);
    });
  }

  function setFrozenColumnByIndex(colIndex: number, silent: boolean = false) {
    if (colIndex > columnCount.value - 1) return;
    let offset = getColumnOffset(colIndex);
    let width = getColumnWidth(colIndex);

    if (offset + width > stageWidth.value - 50) {
      globalStore.onMessage("无法冻结超出一屏的内容！", "error");
      return;
    }

    globalStore.frozenColumns = colIndex + 1;
    forceUpdateUi();

    eventBaseMethods.emit(
      EventName.FROZEN_COLUMNS_CHANGE,
      globalStore.frozenColumns
    );
  }

  function cancelFrozenColumn() {
    globalStore.frozenColumns = 0;
    eventBaseMethods.emit(
      EventName.FROZEN_COLUMNS_CHANGE,
      globalStore.frozenColumns
    );
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

  function getRowOffset(index: number, pure: boolean = false): number | -1 {
    if (!rowAreaBounds.value[index]) return -1;
    return rowAreaBounds.value[index].top;
  }

  function getColumnOffset(index: number): number | -1 {
    if (!columnAreaBounds.value[index]) return -1;
    return columnAreaBounds.value[index].left;
  }

  function getRowHeight(index) {
    if (!rowAreaBounds.value[index]) return 0;
    return rowAreaBounds.value[index].bottom - rowAreaBounds.value[index].top;
  }

  function getColumnWidth(index) {
    return (
      columnAreaBounds.value[index].right - columnAreaBounds.value[index].left
    );
  }

  function getRows() {
    return rows.value;
  }

  function getColumns() {
    return columns.value;
  }

  function getColumnByColIndex(colIndex: number): Column {
    return columns.value[colIndex];
  }

  function getColumnIndexByColId(colId: string): number {
    return columns.value.findIndex((col) => col.id === colId);
  }

  function getCellValueByCoord(
    coord: CellInterface,
    originalValue: boolean = true
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

  function setCellValueById(
    rowId: string,
    colId: string,
    value,
    options: any = {}
  ) {
    const rowIndex = rows.value.findIndex((r) => r.id === rowId);
    const colIndex = columns.value.findIndex((c) => c.id === colId);

    setCellValueByCoord(
      {
        rowIndex: rowIndex,
        columnIndex: colIndex,
      },
      value,
      options
    );
  }

  function setCellValueByCoord(
    coord: CellInterface,
    value,
    options: {
      force: boolean;
      skipColumnDataTransformer: boolean;
      silent: false; //  如果为 true 时，不会触发 CellValueUpdated 事件
    }
  ) {
    options = Object.assign(
      {
        silent: false, //  如果为 true 时，不会触发 CellValueUpdated 事件
        force: false, //  如果为 true 时，将会强行更新（因为如果 cell 值前后一样的话是不会更新的）
        reRenderCell: false, //  是否重新渲染单元格，默认情况下是不渲染，因为 luckysheet 内部调用时会自动重新渲染整个表格
      },
      options
    );

    if (isReadonlyCell(coord) && !options.force) {
      return;
    }
    const column = getColumnByColIndex(coord.columnIndex);
    const row = getRowByIndex(coord.rowIndex);
    const oldValue = rows.value[coord.rowIndex][column.id];
    const newValue = options.skipColumnDataTransformer
      ? value
      : getColumnDataTransformer(coord.columnIndex, "parseValueToData", value);

    rows.value[coord.rowIndex][column.id] = newValue;

    if (!options.silent && row) {
      const payload: EventPayloadType<EventName.CELL_VALUE_UPDATE> = {
        rowIndex: coord.rowIndex,
        columnIndex: coord.columnIndex,
        rowId: row.id,
        columnId: column.id,
        row: row,
        column: column,
        value: newValue,
        oldValue: oldValue,
        isVerified:
          column.dataVerification && column.dataVerification.length > 0
            ? !!verify(newValue, column.dataVerification)
            : true,
      };
      eventBaseMethods.emit(EventName.CELL_VALUE_UPDATE, payload);
    }
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

  function getRowIndexByRowId(rowId: string): number {
    const row = getRowByRowId(rowId);
    return row ? rows.value.findIndex((r) => r.id === rowId) : -1;
  }

  function getRowByIndex(rowIndex: number): Row | null {
    const row = rows.value[rowIndex];
    return row ? row : null;
  }

  function deleteCellValue(cell: CellInterface, force: boolean = false): void {
    if (isReadonlyCell(cell) && !force) return;
    const column = getColumnByColIndex(cell.columnIndex);
    rows.value[cell.rowIndex][column.id] = "";
  }

  function deleteCellsBySelection(selections?: SelectionArea[]): void {
    const selectionsArr = selections ? selections : globalStore.selections;

    const cells = flatSelectionsToCellInterfaceArr(selectionsArr);
    cells.map((cell) => {
      deleteCellValue(cell);
    });
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

  function getSelectRows(): number[] {
    return globalStore.selectedRows;
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

  function _triggerNoteUpdate(note: Note) {
    const payload: EventPayloadType<EventName.CELL_NOTE_UPDATE> = note;
    eventBaseMethods.emit(EventName.CELL_NOTE_UPDATE, payload);
  }

  function updateNote(note: Partial<Note>, silent: boolean = false) {
    const targetNote = globalStore.notes.find(
      (n) => n.rowId === note.rowId && n.colId === note.colId
    );

    if (targetNote) {
      Object.assign(targetNote, note);
      !silent && _triggerNoteUpdate(targetNote);
    } else {
      //  @ts-ignore
      addNote(note, silent);
    }
  }

  function addNote(
    note: Pick<Note, "rowId" | "colId" | "note">,
    silent: boolean = false
  ) {
    const targetNote = globalStore.notes.find(
      (n) => n.rowId === note.rowId && n.colId === note.colId
    );

    if (!targetNote) {
      let newNote = getDefaultNote();
      newNote = Object.assign(newNote, note) as Note;
      //  @ts-ignore
      globalStore.notes.push(newNote);
      !silent && _triggerNoteUpdate(newNote as Note);
    } else {
      updateNote(note, silent);
    }
  }

  function showNoteByCoord(coord: CellInterface) {
    const column = getColumnByColIndex(coord.columnIndex);
    const row = getRowByIndex(coord.rowIndex);
    if (!row || !column) return;
    if (!isHaveNote(coord)) {
      addNote(
        {
          rowId: row.id,
          colId: column.id,
          note: "",
        },
        true
      );
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
      const payload: EventPayloadType<EventName.CELL_NOTE_UPDATE> = targetNote;
      eventBaseMethods.emit(EventName.CELL_NOTE_DELETED, payload);
    }
  }

  function getColumnStartIndexForOffset(offset: number): number {
    const columnAreaBounds = globalStore.columnAreaBounds as AreaBounds[];
    let index = 0;
    if(!columnAreaBounds[index]) return 0
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
    if (!rowCount.value) return 0;
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

  function getStageInstance(): Konva.Stage | null {
    if (stageRef.value) {
      return stageRef.value.getStage();
    }

    return null;
  }

  function pasteFromClipboard() {
    stageContainerRef.value?.focus();
    document.dispatchEvent(new Event("paste"));
  }

  function copyLastSelections() {
    stageContainerRef.value?.focus();
    document.dispatchEvent(new Event("copy"));
  }

  function showLoading(): void {
    globalStore.loading = true;
  }

  function hideLoading(): void {
    globalStore.loading = false;
  }

  function insertRows(
    startIndex: number,
    rows: Row[],
    isAbove: boolean = false
  ): void {
    let index = isAbove ? startIndex : startIndex + 1;
    globalStore._rows.splice(index, 0, ...rows);

    setSelections([
      {
        bounds: {
          top: index,
          left: 0,
          right: columnCount.value - 1,
          bottom: index + rows.length - 1,
        },
      },
    ]);
  }

  function deleteRows(rowIds: string[]) {
    globalStore._rows = globalStore._rows.filter((row, index) => {
      return !rowIds.includes(row.id);
    });
    globalStore.activeCell = null;
    setSelections([]);
  }

  function deleteColumnsById(colsId: string[]) {
    globalStore._columns = globalStore._columns.filter((col) => {
      return !colsId.includes(col.id);
    });
  }

  function getRowCount() {
    return globalStore.rowCount;
  }

  function updateConfig(key: keyof State, value: any): void {
    globalStore[key] = value;
  }

  function getConfig(key: string): any {
    return globalStore[key];
  }

  function isRowExisted(rowIndex): boolean {
    return !!rows[rowIndex];
  }

  function getFrozenColumnIndex() {
    return globalStore.frozenColumns;
  }

  async function checkIsSensitiveOperate(count: number): Promise<boolean> {
    return showConfirm(count);
  }

  onBeforeUnmount(() => {
    cache = null;
  });

  cache = {
    ...eventBaseMethods,
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
    getSelections,
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
    hiddenColumnByIndexes,
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
    getColumns,
    getRows,
    getCellValueByCoord,
    getColumnByColIndex,
    getColumnIndexByColId,
    setCellValueByCoord,
    setCellValueById,
    isHiddenColumn,
    isHiddenRow,
    getColumnByFieldId,
    getRowByRowId,
    getRowByIndex,
    getRowIndexByRowId,
    deleteCellValue,
    isMouseInRowHeader,
    isMouseInColumnHeader,
    isMouseInCells,
    selectAllRows,
    setRowsSelect,
    getSelectRows,
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
    getStageInstance,
    copyLastSelections,
    pasteFromClipboard,
    showLoading,
    hideLoading,
    insertRows,
    deleteRows,
    deleteColumnsById,
    deleteCellsBySelection,
    getRowCount,
    updateConfig,
    getConfig,
    isRowExisted,
    getFrozenColumnIndex,
    checkIsSensitiveOperate,
  };

  return cache;
}
