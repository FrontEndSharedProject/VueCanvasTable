import { computed, ComputedRef, getCurrentInstance, ref, watch } from "vue";
import { isArray, isFunction, isNumber } from "lodash-es";
import { Row } from "@/Grid/types";
import { useGlobalStore } from "@/store/global";

type ReturnType = {
  rowHeights: ComputedRef<number[]>;
};

export function useRowHeights(): ReturnType {
  const instance = getCurrentInstance() as any;
  const globalStore = useGlobalStore();
  const rowHeights = computed(() => globalStore.rowHeights as number[]);

  watch(
    () => instance.props.rowHeights,
    (val) => {
      const defaultRowHeightsArr = Array(instance.props.rows.length).fill(
        instance.props.defaultRowHeight
      );
      let rowHeightsData: number[] = [];

      if (!val) {
        rowHeightsData = defaultRowHeightsArr;
      } else if (isNumber(val)) {
        rowHeightsData = Array(instance.props.rows.length).fill(val);
      } else if (isArray(val)) {
        defaultRowHeightsArr.splice(0, val.length, ...val);

        rowHeightsData = defaultRowHeightsArr;
      } else if (isFunction(val)) {
        rowHeightsData = instance.props.rows.map((row: Row, index: number) => {
          return val(index, row) ?? instance.props.defaultRowHeight;
        });
      }

      globalStore.rowHeights = rowHeightsData;
    },
    {
      immediate: true,
    }
  );

  return {
    rowHeights,
  };
}
