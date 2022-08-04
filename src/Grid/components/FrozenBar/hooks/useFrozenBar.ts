import { computed, ComputedRef, ref, Ref } from "vue";
import { useStore } from "@/hooks/useStore";
import { useDimensions } from "@/hooks/useDimensions";
import { useExpose } from "@/Grid/hooks/useExpose";

type ReturnType = {
  isShow: ComputedRef<boolean>;
  left: ComputedRef<number>;
  bottom: ComputedRef<number>;
};

export function useFrozenBar(): ReturnType {
  const { frozenColumns, columnAreaBounds } = useStore();
  const { rowHeaderWidth, scrollbarSize } = useDimensions();
  const { isHiddenColumn } = useExpose();

  const frozenIndex = computed(() => frozenColumns.value - 1);
  const isShow = computed(() => {
    let isHaveShowingColumn = false;
    for (let i = frozenIndex.value; i >= 0; i--) {
      if (!isHiddenColumn(i)) {
        isHaveShowingColumn = true;
        break;
      }
    }

    return frozenIndex.value >= 0 && isHaveShowingColumn;
  });
  const left = computed(
    () => columnAreaBounds.value[frozenIndex.value].right + rowHeaderWidth.value
  );
  const bottom = computed(() => scrollbarSize.value);

  return {
    isShow,
    left,
    bottom,
  };
}
