import { computed, onBeforeUnmount, onMounted, Ref } from "vue";
import { useStore } from "@/hooks/useStore";
import { isElementContainsClassOrIsChildOf } from "@/utils";
import { selectionFromActiveCell } from "@/helpers";
import { CopyDataItemFormat, GsClipboard } from "gs-clipboard";
import { useExpose } from "@/Grid/hooks/useExpose";
import { useGlobalStore } from "@/store/global";
import { KeyCodes } from "@/enums";
import { SelectionArea } from "@/types";

/**
 * copy 粘贴处理
 */

type Props = {
  wrap: Ref<HTMLDivElement | undefined>;
};

export function useCopyPaste(props: Props) {
  const mousePosition = { x: 0, y: 0 };
  const GS = new GsClipboard({
    //  https://github.com/carl-jin/gs-clipboard 配置
    // handlers: [],
    // unknownHtmlParser: [],
    // tableParsers: [],
  });
  let shiftKeyOn = false;
  let isCut = false;
  let copyRange: SelectionArea | null = null;

  const globalStore = useGlobalStore();
  const { stageContainerRef, selections, activeCell, rowCount, columnCount } =
    useStore();
  const {
    isReadonlyColumn,
    isReadonlyRow,
    setSelections,
    getCellCoordsFromOffset,
    isCellExists,
    getCellValueByCoord,
    getColumnByColIndex,
    setCellValueByCoord,
  } = useExpose();

  const GSCHandlers = computed(() => globalStore.GSCHandlers);

  onMounted(() => {
    if (props.wrap.value) {
      document.addEventListener("copy", handleCopy);
      document.addEventListener("paste", handlePaste);
      document.addEventListener("cut", handleCut);
      document.addEventListener("mousemove", handleMousemove);
      document.addEventListener("keydown", handleKeydown);
      document.addEventListener("keyup", handleKeyup);
    }
  });

  onBeforeUnmount(() => {
    if (props.wrap.value) {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("mousemove", handleMousemove);
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.keyCode === KeyCodes.Shift) {
      shiftKeyOn = true;
    }
  }

  function handleKeyup(e: KeyboardEvent) {
    if (e.keyCode === KeyCodes.Shift) {
      shiftKeyOn = false;
    }
  }

  function handleMousemove(e: MouseEvent) {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
  }

  async function handlePaste(e: ClipboardEvent) {
    const activeElement = document.activeElement;
    if (!activeElement) return;
    if (!stageContainerRef.value) return;
    if (
      !isElementContainsClassOrIsChildOf(
        activeElement,
        stageContainerRef.value.classList[0]
      )
    ) {
      return;
    }
    e.preventDefault();

    const startCoord = getCellCoordsFromOffset(
      mousePosition.x,
      mousePosition.y
    );
    if (!startCoord) return;
    const clipboardData = await GS.getDataFromClipboard();

    if (isCut && copyRange) {
      isCut = false;

      console.log(copyRange, 33);

      copyRange = null;
    }

    if (shiftKeyOn) {
      if (isReadonlyRow(startCoord.rowIndex)) return;
      if (isReadonlyColumn(startCoord.columnIndex)) return;
      setCellValueByCoord(startCoord, clipboardData.text);
      setSelections([
        {
          bounds: {
            top: startCoord.rowIndex,
            bottom: startCoord.rowIndex,
            left: startCoord.columnIndex,
            right: startCoord.columnIndex,
          },
        },
      ]);
      return;
    }

    clipboardData.clipboardType.map((row: CopyDataItemFormat[], y) => {
      row.map((item: any, x) => {
        const rowIndex = y + startCoord.rowIndex;
        const colIndex = x + startCoord.columnIndex;
        const column = getColumnByColIndex(colIndex);
        let value = item.value;

        if (isReadonlyRow(rowIndex)) return;
        if (isReadonlyColumn(colIndex)) return;

        if (item.type) {
          let text = "";
          let html = "";
          const correspondingHandler = GSCHandlers.value.find(
            (_item) => _item.type === item.type
          );
          if (correspondingHandler) {
            text = correspondingHandler.toText(item.value);
            html = correspondingHandler.toHtml(item.value);
          }

          //  RichSpreadsheet/src/controllers/hooks/useGsClipboard.ts
          //  todo 调用 column 的数据转换方法
        }

        const targetCoord = {
          rowIndex: rowIndex,
          columnIndex: colIndex,
        };
        if (isCellExists(targetCoord)) {
          setCellValueByCoord(targetCoord, value);
        }
      });
    });

    setSelections([
      {
        bounds: {
          left: startCoord.columnIndex,
          top: startCoord.rowIndex,
          right: Math.min(
            clipboardData.clipboardType[0].length - 1 + startCoord.columnIndex,
            columnCount.value
          ),
          bottom: Math.min(
            clipboardData.clipboardType.length - 1 + startCoord.rowIndex,
            rowCount.value
          ),
        },
      },
    ]);
  }

  function handleCopy(e: ClipboardEvent) {
    const activeElement = document.activeElement;
    if (!activeElement) return;
    if (!stageContainerRef.value) return;
    if (
      !isElementContainsClassOrIsChildOf(
        activeElement,
        stageContainerRef.value.classList[0]
      )
    ) {
      return;
    }
    e.preventDefault();

    /* Only copy the last selection */
    const selection = currentSelections();
    copyRange = selection;
    const { bounds } = selection;
    const { top, left, right, bottom } = bounds;
    const rows: any[] = [];

    for (let i = top; i <= bottom; i++) {
      const row: any[] = [];
      for (let j = left; j <= right; j++) {
        const column = getColumnByColIndex(i);
        row.push({
          x: j,
          y: i,
          value: getCellValueByCoord({ rowIndex: i, columnIndex: j }),
          type: column.type,
          payload: column,
        });
      }
      rows.push(row);
    }

    GS.setCopy(rows);
  }

  function handleCut(e: ClipboardEvent) {
    const activeElement = document.activeElement;
    if (!activeElement) return;
    if (!stageContainerRef.value) return;
    if (
      !isElementContainsClassOrIsChildOf(
        activeElement,
        stageContainerRef.value.classList[0]
      )
    ) {
      return;
    }
    e.preventDefault();

    setSelections([currentSelections()]);
    handleProgramaticCopy();
  }

  function handleProgramaticCopy() {
    if (!stageContainerRef.value) return;
    isCut = true;
    stageContainerRef.value.focus();
    document.execCommand("copy");
  }

  function currentSelections() {
    const sel = selections.value.length
      ? selections.value
      : selectionFromActiveCell(activeCell.value);
    return sel[sel.length - 1];
  }
}
