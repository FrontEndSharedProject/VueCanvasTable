import { Row } from "@/Grid/types";
import { computed, ComputedRef } from "vue";
import { useGlobalStore } from "@/store/global";
import { useHelpers } from "@/hooks/useHelpers";

type RowRenderProps = Row & {
  height: number;
};
type ReturnType = {
  rows: ComputedRef<RowRenderProps[]>;
};

export function useRowHeaderRender(): ReturnType {
  const globalStore = useGlobalStore();

  const { getRowHeight } = useHelpers();

  //  @ts-ignore
  const rows = computed<RowRenderProps[]>(() => {
    //  @ts-ignore
    return globalStore.rows.map((row, index) => {
      //  @ts-ignore
      row.height = getRowHeight(index);
      return row;
    }) as RowRenderProps;
  });

  return {
    rows,
  };
}
