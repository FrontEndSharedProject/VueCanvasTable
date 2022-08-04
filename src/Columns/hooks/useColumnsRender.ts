import { computed, ComputedRef, ref, Ref, watch } from "vue";
import { useGlobalStore } from "@/store/global";
import { Column } from "@/Grid/types";
import { isEqual } from "lodash-es";
import { useStore } from "@/hooks/useStore";
import { useExpose } from "@/Grid/hooks/useExpose";

export type ColumnRenderProps = Column & {
  width: number;
  height: number;
  isFrozenColumn: boolean;
  left: number;
};

type ReturnType = {
  columns: ComputedRef<ColumnRenderProps[]>;
  selectedColumns: ComputedRef<number[]>;
  isSelected(col: ColumnRenderProps): boolean;
  isHover(col: ColumnRenderProps): boolean;
};

export function useColumnsRender(): ReturnType {
  const globalStore = useGlobalStore();
  const { selectedColumns, frozenColumns, columns: _columns } = useStore();

  const { getColumnWidth, isHiddenColumn, getColumnOffset } = useExpose();
  const selections = computed(() => globalStore.selections);
  const activeCell = computed(() => globalStore.activeCell);

  //  @ts-ignore
  const columns = computed<ColumnRenderProps[]>(() => {
    //  @ts-ignore
    return _columns.value.map((col, index) => {
      col.width = getColumnWidth(index);
      col.hidden = isHiddenColumn(index);
      col.isFrozenColumn = index < frozenColumns.value;
      col.left = getColumnOffset(index);
      return col;
    }) as ColumnRenderProps;
  });

  //  取消 Column 的 selected 状态规则
  //  1. activeCell 改变时需要取消
  //  单击 column 时需要取消
  watch(activeCell, (val) => {
    let data = selectedColumns.value.filter((index) => {
      return index === val.columnIndex;
    });

    if (!isEqual(data, selectedColumns.value)) {
      globalStore.selectedColumns = data;
    }
  });

  function isSelected(col: ColumnRenderProps): boolean {
    const index = columns.value.findIndex((c) => c.id === col.id);
    if (!~index) return false;
    return selectedColumns.value.includes(index);
  }

  function isHover(col: ColumnRenderProps): boolean {
    const index = columns.value.findIndex((c) => c.id === col.id);
    if (!~index) return false;

    if (activeCell.value) {
      if (activeCell.value.columnIndex === index) {
        return true;
      }
    }

    for (let i = 0; i < selections.value.length; i++) {
      const selection = selections.value[i];
      if (selection.bounds.left <= index && index <= selection.bounds.right) {
        return true;
      }
    }

    return false;
  }

  return {
    columns,
    selectedColumns,
    isSelected,
    isHover,
  };
}
