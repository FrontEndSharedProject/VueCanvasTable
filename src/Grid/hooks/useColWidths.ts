import {
  computed,
  ComputedRef,
  getCurrentInstance,
  ref,
  Ref,
  watch,
} from "vue";
import { isArray, isFunction, isNumber } from "lodash-es";
import { Row } from "@/Grid/types";
import { useGlobalStore } from "@/store/global";

type ReturnType = {
  colWidths: ComputedRef<number[]>;
};

export function useColWidths(): ReturnType {
  const instance = getCurrentInstance() as any;
  const globalStore = useGlobalStore();
  const colWidths = computed(() => globalStore.colWidths as number[]);

  watch(
    () => instance.props.colWidths,
    (val) => {
      const defaultColWidthsArr = Array(instance.props.columns.length).fill(
        instance.props.defaultColWidth
      );
      let colWidthsData: number[] = [];

      if (!val) {
        colWidthsData = defaultColWidthsArr;
      } else if (isNumber(val)) {
        colWidthsData = Array(instance.props.columns.length).fill(val);
      } else if (isArray(val)) {
        defaultColWidthsArr.splice(0, val.length, ...val);

        colWidthsData = defaultColWidthsArr;
      } else if (isFunction(val)) {
        colWidthsData = instance.props.rows.map((row: Row, index: number) => {
          return val(index, row) ?? instance.props.defaultColWidth;
        });
      }


      globalStore.colWidths = colWidthsData;
    },
    {
      immediate: true,
    }
  );

  return {
    colWidths,
  };
}
