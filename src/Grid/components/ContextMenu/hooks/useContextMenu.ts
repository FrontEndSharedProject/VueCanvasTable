import { onMounted, ref, Ref, shallowRef, ShallowRef } from "vue";
import { useStore } from "$vct/hooks/useStore";
import {
  arrayFlatFromRage,
  coordsTo2dArray,
  isElementContainsClassOrIsChildOf,
} from "$vct/utils";
import { ClassNameEnum, MenuTypeEnum } from "$vct/enums";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { Column, ContextMenuRenderProps, Row } from "$vct/Grid/types";
import { useDimensions } from "$vct/hooks/useDimensions";
import { useGlobalStore } from "$vct/store/global";
import { cloneDeep } from "lodash-es";

type ReturnType = {
  isShow: Ref<boolean>;
  left: Ref<number>;
  top: Ref<number>;
  renderProps: Ref<ContextMenuRenderProps>;
  type: Ref<MenuTypeEnum>;
};

let defaultRenderProps: ContextMenuRenderProps = {
  rows: [],
  columns: [],
  values: [],
  cells: [],
  selections: [],
  rowIds: [],
  columnIds: [],
  columnsIndexes: [],
  startColumnIndex: -1,
  endColumnIndex: -1,
  startRowIndex: -1,
  endRowIndex: -1,
  close: () => {},
};

export function useContextMenu(): ReturnType {
  const globalStore = useGlobalStore();
  const { tableRef, stageContainerRef, selections, columns } = useStore();
  const {
    getCellCoordsFromOffset,
    getRowByIndex,
    getColumnByColIndex,
    getCellValueByCoord,
    isMouseInRowHeader,
    isMouseInColumnHeader,
    getColumnIndexByColId,
  } = useExpose();
  const { columnHeight, rowHeaderWidth } = useDimensions();

  const isShow = ref<boolean>(false);
  const left = ref<number>(0);
  const top = ref<number>(0);
  const renderProps = ref<ContextMenuRenderProps>(defaultRenderProps);
  const type = ref<MenuTypeEnum>(MenuTypeEnum.CELL);

  onMounted(() => {
    if (tableRef.value) {
      tableRef.value?.addEventListener("contextmenu", handleContextMenu);
      tableRef.value?.addEventListener("mousedown", handleMousedown);
    }
  });

  function openContextMenu(e: MouseEvent) {
    const target = e.target as HTMLDivElement;
    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);
    if (!coords) return;
    if (!tableRef.value) return;
    if (!stageContainerRef.value) return;
    if (!globalStore.contextMenuConfigs) return;
    type.value = MenuTypeEnum.CELL;
    let selectionsArr = cloneDeep(selections.value);

    //  如果没有 selection 则使用 active cell
    if (selectionsArr.length === 0 && globalStore.activeCell) {
      selectionsArr.push({
        bounds: {
          left: globalStore.activeCell.columnIndex,
          right: globalStore.activeCell.columnIndex,
          top: globalStore.activeCell.rowIndex,
          bottom: globalStore.activeCell.rowIndex,
        },
      });
    }

    renderProps.value = defaultRenderProps;

    //  由于即使点击 columnHeader 或者 rowHeader 依然会返回 coords
    //  但是 rowIndex 或者 columnIndex 会为 0
    const { left: sLeft, top: sTop } =
      stageContainerRef.value.getBoundingClientRect();

    //  如果是 row header
    if (isMouseInRowHeader(e.clientX, e.clientY)) {
      type.value = MenuTypeEnum.ROW;
    }

    //  如果是 column header
    if (isMouseInColumnHeader(e.clientX, e.clientY)) {
      type.value = MenuTypeEnum.COLUMN;
    }

    //  rows
    let selectedRows: number[] = arrayFlatFromRage(
      selectionsArr.reduce<number[][]>((prev, current) => {
        prev.push([current.bounds.top, current.bounds.bottom]);
        return prev;
      }, [])
    );
    renderProps.value.rows = selectedRows.map(
      (rowIndex) => getRowByIndex(rowIndex) as Row
    );
    //  rowIds
    renderProps.value.rowIds = renderProps.value.rows.map((r) => r.id);

    //  columns
    let selectedColumns: number[] = arrayFlatFromRage(
      selectionsArr.reduce<number[][]>((prev, current) => {
        prev.push([current.bounds.left, current.bounds.right]);
        return prev;
      }, [])
    );
    renderProps.value.columns = selectedColumns.map(
      (colId) => getColumnByColIndex(colId) as Column
    );
    //  columnIds
    renderProps.value.columnIds = renderProps.value.columns.map((c) => c.id);
    //  columnsIndexes
    renderProps.value.columnsIndexes = renderProps.value.columnIds.map((id) => {
      return getColumnIndexByColId(id);
    });

    //  values
    let cellCoordsData: any[] = [];
    for (let i = 0; i < selectionsArr.length; i++) {
      const selection = selectionsArr[i];
      let {
        left: colStart,
        right: colEnd,
        top: rowStart,
        bottom: rowEnd,
      } = selection.bounds;
      for (let j = colStart; j <= colEnd; j++) {
        let colIndex = j;
        for (let k = rowStart; k <= rowEnd; k++) {
          let rowIndex = k;

          renderProps.value.cells.push({
            columnIndex: colIndex,
            rowIndex: rowIndex,
            value: getCellValueByCoord({ rowIndex: k, columnIndex: j }),
          });
          cellCoordsData.push({
            x: colIndex,
            y: rowIndex,
            value: getCellValueByCoord({ rowIndex: k, columnIndex: j }),
          });
        }
      }
    }
    renderProps.value.values =
      cellCoordsData.length > 0
        ? coordsTo2dArray(cellCoordsData, (res) => res.value)
        : [];

    //  selections
    renderProps.value.selections = [...selectionsArr];

    if (selectionsArr.length > 0) {
      renderProps.value.endColumnIndex =
        selectionsArr[selectionsArr.length - 1].bounds.right;
      renderProps.value.startRowIndex = selectionsArr[0].bounds.left;
      renderProps.value.endRowIndex =
        selectionsArr[selectionsArr.length - 1].bounds.bottom;
      renderProps.value.startRowIndex = selectionsArr[0].bounds.top;
    }

    //
    //  计算位置
    const {
      x: px,
      y: py,
      width: pw,
      height: ph,
    } = tableRef.value.getBoundingClientRect();
    left.value = e.clientX - px;
    top.value = e.clientY - py;

    renderProps.value.close = close;

    //  估算下 menu 的高度, 处理溢出问题
    const list = globalStore
      .contextMenuConfigs(renderProps.value, type.value)
      .filter((item) => {
        return item.title && !item.hide;
      });
    let estimateHeight = list.length * 34 + 10;

    if (top.value + estimateHeight + py > window.innerHeight) {
      top.value = window.innerHeight - estimateHeight - py - 4;
    }

    isShow.value = true;
  }

  function handleMousedown(e: MouseEvent) {
    if (!isShow.value) return;
    const target = e.target as HTMLDivElement;
    if (!target) return close();

    //  点击到 table 以外
    if (!isElementContainsClassOrIsChildOf(target, ClassNameEnum.TABLE_WRAP)) {
      return close();
    } else {
      //  点击的 table 中其他元素也关闭
      if (
        !isElementContainsClassOrIsChildOf(
          target,
          ClassNameEnum.CONTEXTMENU_WRAP
        )
      ) {
        return close();
      }
    }
  }

  function handleContextMenu(e: MouseEvent) {
    const target = e.target as HTMLDivElement;
    if (
      !target ||
      !isElementContainsClassOrIsChildOf(target, ClassNameEnum.TABLE_WRAP) ||
      isElementContainsClassOrIsChildOf(target, ClassNameEnum.CELL_EDIT_BOX)
    ) {
      close();
      return;
    }

    e.preventDefault();

    //  先关闭之前的
    if (isShow.value) close();

    setTimeout(() => {
      openContextMenu(e);
    }, 100);
  }

  function close() {
    isShow.value = false;
  }

  return {
    isShow,
    left,
    top,
    renderProps,
    type,
  };
}
