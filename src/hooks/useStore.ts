import { computed, ComputedRef } from "vue";
import { useGlobalStore } from "@/store/global";
import { ScrollStateType } from "@/Grid/hooks/useScroll";

type ReturnType = {
  rowHeights: ComputedRef<number[]>;
  colWidths: ComputedRef<number[]>;
  scrollState: ComputedRef<ScrollStateType>;
};

export function useStore(): ReturnType {
  const globalStore = useGlobalStore();

  const rowHeights = computed(() => globalStore.rowHeights as number[]);
  const colWidths = computed(() => globalStore.colWidths as number[]);
  const scrollState = computed(() => globalStore.scrollState);

  return {
    rowHeights,
    colWidths,
    scrollState,
  };
}
