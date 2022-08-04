/**
 * 用于处理数据变更时自动刷新视图功能
 * 主要通过 :key 的变更，来进行重新渲染
 */
import { Ref, ref, watch } from "vue";
import { useStore } from "@/hooks/useStore";
import { useGlobalStore } from "@/store/global";

type ReturnType = {
  autoUpdateUIKey: Ref<number>;
};

let cache: ReturnType | null = null;

export function useAutoUpdateUI(): ReturnType {
  if (cache) return cache;
  const globalStore = useGlobalStore();
  const { hiddenColumns, colWidths, columns } = useStore();

  const autoUpdateUIKey = ref(Math.random());

  watch(
    () => [
      hiddenColumns.value,
      colWidths.value,
      globalStore._UiForceUpdateRandom,
    ],
    () => {
      autoUpdateUIKey.value = Math.random();
    },
    {
      deep: true,
    }
  );

  cache = {
    autoUpdateUIKey,
  };

  return cache;
}
