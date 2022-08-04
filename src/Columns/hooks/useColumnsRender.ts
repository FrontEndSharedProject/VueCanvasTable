import { computed, ComputedRef, ref, Ref } from "vue";
import { useGlobalStore } from "@/store/global";
import { Column } from "@/Grid/types";
import { useHelpers } from "@/hooks/useHelpers";

type ColumnRenderProps = Column & {
  width: number;
};

type ReturnType = {
  columns: ComputedRef<ColumnRenderProps[]>;
};

export function useColumnsRender(): ReturnType {
  const globalStore = useGlobalStore();

  const { getColumnWidth } = useHelpers();

  //  @ts-ignore
  const columns = computed<ColumnRenderProps[]>(() => {
    //  @ts-ignore
    return globalStore.columns.map((col, index) => {
      col.width = getColumnWidth(index);
      return col;
    }) as ColumnRenderProps;
  });

  return {
    columns,
  };
}
