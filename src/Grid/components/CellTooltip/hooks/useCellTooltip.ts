import { useStore } from "$vct/hooks/useStore";
import { onMounted, ref, Ref, shallowRef, ShallowRef, watch } from "vue";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { DisplaySwitch } from "../displaySwitch";
import { CellInterface } from "$vct/types";
import { ClassNameEnum } from "$vct/enums";
import { isElementContainsClassOrIsChildOf } from "$vct/utils";

type ReturnType = {
  isShow: Ref<boolean>;
  coord: Ref<CellInterface>;
  hide(): void;
};

export function useCellTooltip(): ReturnType {
  const { stageContainerRef, scrollState } = useStore();
  const { getCellCoordsFromOffset, getColumnByColIndex } = useExpose();

  let displaySwitch = new DisplaySwitch();

  const isShow = ref<boolean>(false);
  const coord = ref<CellInterface>({ rowIndex: -1, columnIndex: -1 });

  let mouseMoveRef: any = null;

  watch(
    scrollState,
    () => {
      if (displaySwitch.lastShowCoord.rowIndex !== -1) {
        hideTooltip();
      }
    },
    {
      deep: true,
    }
  );

  onMounted(() => {
    if (stageContainerRef.value) {
      stageContainerRef.value?.addEventListener("mousemove", handleMouseover);
      stageContainerRef.value?.addEventListener("mouseout", hideTooltip);
    }

    displaySwitch.$on("show", handleShowTooltip);
    displaySwitch.$on("hide", handleHideTooltip);
  });

  function hideTooltip() {
    displaySwitch.hide();
  }

  function handleShowTooltip(_coord: CellInterface) {
    isShow.value = true;
    coord.value = _coord;
  }

  function handleHideTooltip() {
    isShow.value = false;
    coord.value = {
      rowIndex: -1,
      columnIndex: -1,
    };
  }

  function handleMouseover(e: MouseEvent) {
    if (mouseMoveRef) return;
    const target = e.target as HTMLDivElement;
    if (
      isElementContainsClassOrIsChildOf(target, ClassNameEnum.CELL_TOOLTIP_WRAP)
    ) {
      displaySwitch.cancelHiding();
      return;
    }
    mouseMoveRef = window.requestAnimationFrame(() => {
      mouseMoveRef = null;
      const coords = getCellCoordsFromOffset(e.clientX, e.clientY);
      if (!coords) {
        displaySwitch.hide();
        return;
      }
      const columnIndex = coords.columnIndex;
      const column = getColumnByColIndex(columnIndex);
      if (!column || !column.cellTooltiper) {
        displaySwitch.hide();
        return;
      }

      if (target.tagName === "CANVAS") {
        displaySwitch.show(coords);
      } else {
        if (
          isElementContainsClassOrIsChildOf(
            target,
            ClassNameEnum.CELL_TOOLTIP_WRAP
          )
        ) {
          return;
        } else {
          displaySwitch.hide();
        }
      }
    });
  }

  return {
    isShow,
    coord,
    hide: hideTooltip,
  };
}
