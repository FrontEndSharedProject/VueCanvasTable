import { watchEffect } from "vue";
import { useGlobalStore } from "$vct/store/global";
import { useStore } from "$vct/hooks/useStore";
import { AreaBounds } from "$vct/types";

export function useRowHeights() {
  const { rows, rowHeights, defaultRowHeight } = useStore();
  const globalStore = useGlobalStore();

  watchEffect(() => {
    let rowAreaBounds: AreaBounds[] = [];
    const offset = 0;
    let contentHeight: number = 0;
    rows.value.map((row, index) => {
      const height = rowHeights.value[row.id] ?? defaultRowHeight.value;

      rowAreaBounds.push({
        left: 0,
        right: globalStore.scrollState.contentWidth,
        top: contentHeight,
        bottom: contentHeight + height + offset,
      });

      contentHeight += height + offset;
    });

    globalStore.rowAreaBounds = rowAreaBounds;
  });
}
