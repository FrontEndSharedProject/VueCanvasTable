import { useGlobalStore } from "$vct/store/global";
import { useStore } from "$vct/hooks/useStore";
import { watch } from "vue";
import { FilterRowsConfig } from "$vct/types";
import { Column } from "$vct/Grid/types";
import { useExpose } from "$vct/Grid/hooks/useExpose";

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
