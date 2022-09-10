import {
  computed,
  ComputedRef,
  getCurrentInstance,
  ref,
  Ref,
  watch,
  watchEffect,
} from "vue";
import { isArray, isFunction, isNumber } from "lodash-es";
import { Row } from "$vct/Grid/types";
import { useGlobalStore } from "$vct/store/global";
import { useStore } from "$vct/hooks/useStore";
import { AreaBounds } from "$vct/types";
import { useDimensions } from "$vct/hooks/useDimensions";
import { useExpose } from "$vct/Grid/hooks/useExpose";

export function useColWidths() {
  const { columns, colWidths, defaultColWidth } = useStore();
  const { columnHeight } = useDimensions();
  const { isHiddenColumn } = useExpose();
  const globalStore = useGlobalStore();

  watchEffect(() => {
    let columnAreaBounds: AreaBounds[] = [];
    const offset = 0;
    let contentWidth: number = 0;

    columns.value.map((col, index) => {
      const width = colWidths.value[col.id] ?? defaultColWidth.value;

      if (isHiddenColumn(index)) {
        columnAreaBounds.push({
          left: -1,
          right: -1,
          top: -1,
          bottom: -1,
        });
      } else {
        columnAreaBounds.push({
          left: contentWidth,
          right: contentWidth + width + offset,
          top: 0,
          bottom: columnHeight.value,
        });

        contentWidth += width + offset;
      }
    });

    globalStore.columnAreaBounds = columnAreaBounds;
  });
}
