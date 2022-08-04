import { useGlobalStore } from "@/store/global";
import { useStore } from "@/hooks/useStore";
import { watch } from "vue";
import { FilterRowsConfig } from "@/types";
import { Column } from "@/Grid/types";
import { useExpose } from "@/Grid/hooks/useExpose";

/**
 * 快速过滤由后端处理
 */

export function useRowsQuicklyFilters() {
  let isFirstTimeUpdate = true;
  const globalStore = useGlobalStore();
  const { filterRowsConfigs } = useStore();
  const { getRowByRowId, getColumnByFieldId } = useExpose();

  watch(
    filterRowsConfigs,
    (val) => {
      reFilter(val);
    },
    {
      deep: true,
      immediate: true,
    }
  );

  function reFilter(filterConfigs: FilterRowsConfig[]) {
    if (isFirstTimeUpdate && filterConfigs.length === 0) return;
    isFirstTimeUpdate = false;

    let columnsCache: Record<string, Column | null> = filterConfigs.reduce(
      (prev, current) => {
        prev[current.field] = getColumnByFieldId(current.field);
        return prev;
      },
      {}
    );

    if (filterConfigs.length === 0) {
      globalStore.hiddenRows = [];
      return;
    }

    let hiddenRows: string[] = [];

    globalStore.hiddenRows = hiddenRows;
  }
}
