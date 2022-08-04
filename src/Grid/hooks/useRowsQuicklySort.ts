/**
 * 处理行的快速排序
 */
import { useGlobalStore } from "@/store/global";
import { useStore } from "@/hooks/useStore";
import { watch } from "vue";
import { SortRowsConfig } from "@/types";
import { cloneDeep } from "lodash-es";
import { Column } from "@/Grid/types";
import { useExpose } from "@/Grid/hooks/useExpose";

export function useRowsQuicklySort() {
  let isFirstTimeUpdate = true;
  const globalStore = useGlobalStore();
  const { sortRowConfigs } = useStore();
  const { getColumnByFieldId } = useExpose();

  //  保存下最初的 orders 以便取消快速排序后的恢复
  globalStore._originalRowsOrder = globalStore._rows.map((r) => r.id);

  watch(
    sortRowConfigs,
    (val) => {
      resort(val);
    },
    {
      deep: true,
      immediate: true,
    }
  );

  function resort(sortConfigs: SortRowsConfig[]) {
    if (isFirstTimeUpdate && sortConfigs.length === 0) return;
    isFirstTimeUpdate = false;
    let columnsCache: Record<string, Column | null> = sortConfigs.reduce(
      (prev, current) => {
        prev[current.field] = getColumnByFieldId(current.field);
        return prev;
      },
      {}
    );

    if (sortConfigs.length === 0) {
      globalStore._rows.map((r) => {
        r.order = globalStore._originalRowsOrder.indexOf(r.id);
      });
      return;
    }

    let rows = cloneDeep(globalStore._rows);

    //  https://github.com/vueComponent/ant-design-vue/blob/797a1c6c8f6757048bf7356dba935e1a9d0508ed/components/table/hooks/useSorter.tsx#L272
    rows.sort((left, right) => {
      for (let i = 0; i < sortConfigs.length; i++) {
        const currentConfig = sortConfigs[i];
        const field = currentConfig.field;
        const mode = currentConfig.mode;
        let column = columnsCache[field];
        let res = 0;
        if (column && column.cellSorter) {
          res = column.cellSorter(left, right, currentConfig.field, column);
        } else {
          //  todo fields 位置修改
          res = left.fields[field] - right.fields[field];
        }

        if (res !== 0) {
          return mode === "asc" ? res : res * -1;
        }
      }

      return 0;
    });

    globalStore._rows = globalStore._rows.map((r) => {
      r.order = rows.findIndex((_r) => _r.id === r.id);
      return r;
    });
  }
}
