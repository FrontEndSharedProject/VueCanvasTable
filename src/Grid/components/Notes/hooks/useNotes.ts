import { useStore } from "$vct/hooks/useStore";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { DisplaySwitch } from "$vct/Grid/components/CellTooltip/displaySwitch";
import { onMounted, Ref, ref, watch } from "vue";
import { CellInterface, Note } from "$vct/types";
import { isElementContainsClassOrIsChildOf } from "$vct/utils";
import { ClassNameEnum } from "$vct/enums";
import { useGlobalStore } from "$vct/store/global";

type ReturnType = {
  isShow: Ref<boolean>;
  coord: Ref<CellInterface>;
  hide(force?: boolean): void;
};

export const defaultNoteWidth = 194;
export const defaultNoteHeight = 40;
export function getDefaultNote(): Partial<Note> {
  return {
    width: defaultNoteWidth,
    height: defaultNoteHeight,
    note: "",
  };
}

export function useNotes(): ReturnType {
  const globalStore = useGlobalStore();
  const { stageContainerRef, scrollState } = useStore();
  const {
    getCellCoordsFromOffset,
    getColumnByColIndex,
    isHaveNote,
    getNote,
    deleteNote,
    getRowByIndex,
  } = useExpose();

  let displaySwitch = new DisplaySwitch();
  const isShow = ref<boolean>(false);
  const coord = ref<CellInterface>({ rowIndex: -1, columnIndex: -1 });
  let mouseMoveRef: any = null;

  watch(
    scrollState,
    () => {
      if (displaySwitch.lastShowCoord.rowIndex !== -1) {
        hideNote();
      }
    },
    {
      deep: true,
    }
  );

  watch(
    () => globalStore._showNoteWatcher,
    (val) => {
      displaySwitch.show(val);
    }
  );

  onMounted(() => {
    if (stageContainerRef.value) {
      stageContainerRef.value?.addEventListener("mousemove", handleMouseover);
      // stageContainerRef.value?.addEventListener("mouseout", hideNote);
    }

    displaySwitch.$on("show", handleShowCell);
    displaySwitch.$on("hide", handleHideCell);
  });

  function hideNote(force: boolean = false) {
    if (coord.value.rowIndex >= 0) {
      const note = getNote(coord.value);
      if (note && note.note.trim().length === 0) {
        const column = getColumnByColIndex(coord.value.columnIndex);
        const row = getRowByIndex(coord.value.rowIndex);
        if (!column || !row) return;
        deleteNote({
          rowId: row.id,
          colId: column.id,
        });
      }
    }

    displaySwitch.hide(force);
  }

  //  mousemove 只做显示，关闭有 clickoutside 提供
  function handleMouseover(e: MouseEvent) {
    if (mouseMoveRef) return;
    const target = e.target as HTMLDivElement;
    if (
      isElementContainsClassOrIsChildOf(target, ClassNameEnum.CELL_NOTES_WRAP)
    ) {
      displaySwitch.cancelHiding();
      return;
    }
    mouseMoveRef = window.requestAnimationFrame(() => {
      mouseMoveRef = null;
      const coords = getCellCoordsFromOffset(e.clientX, e.clientY);
      if (!coords) {
        return;
      }
      const columnIndex = coords.columnIndex;
      const column = getColumnByColIndex(columnIndex);
      if (!isHaveNote(coords)) {
        //  保证只有鼠标停留在 show note 的 cell 上才会显示
        displaySwitch.wasLastActionShow = false
        return;
      }

      if (target.tagName === "CANVAS") {
        displaySwitch.show(coords);
      } else {
        if (
          isElementContainsClassOrIsChildOf(
            target,
            ClassNameEnum.CELL_NOTES_WRAP
          )
        ) {
          return;
        } else {
          // displaySwitch.hide();
        }
      }
    });
  }

  function handleShowCell(_coord: CellInterface) {
    isShow.value = true;
    coord.value = _coord;
  }

  function handleHideCell() {
    isShow.value = false;
    coord.value = {
      rowIndex: -1,
      columnIndex: -1,
    };
  }

  return {
    isShow,
    coord,
    hide: hideNote,
  };
}
