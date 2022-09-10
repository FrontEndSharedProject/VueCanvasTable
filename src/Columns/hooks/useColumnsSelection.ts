import { computed, onBeforeUnmount, onMounted, ref, Ref, watch } from "vue";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useGlobalStore } from "$vct/store/global";
import { useStore } from "$vct/hooks/useStore";
import { SelectionArea } from "$vct/types";

type Props = {
  wrap: Ref<HTMLDivElement>;
};

type ReturnType = {
  isSelecting: Ref<boolean>;
};

export function useColumnsSelection(props: Props): ReturnType {
  const globalStore = useGlobalStore();
  const { getCellCoordsFromOffset, setSelections, getCellBounds, getViewPort } =
    useExpose();
  const { selectedColumns, rowCount } = useStore();

  const isSelecting = ref<boolean>(false);
  let startSelectedColumnIndex = -1;
  let lastSelectionLength: number = 0;

  watch(selectedColumns, (val) => {
    updateSelections(val);
  });

  onMounted(() => {
    if (props.wrap.value) {
      props.wrap.value?.addEventListener("mousedown", _handleMouseDown);
    }
  });

  onBeforeUnmount(() => {
    if (props.wrap.value) {
      props.wrap.value?.removeEventListener("mousedown", _handleMouseDown);
    }
  });

  function _handleMouseDown(e: MouseEvent) {
    //  由于 useColumnDragSort 也使用到 mousedown
    //  这里需要延迟下，避免 mousedown 比 useColumnDragSort 中的先执行
    setTimeout(() => {
      handleMouseDown(e);
    }, 15);
  }

  function handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLDivElement;
    if (target.classList.contains("resize-grabber")) return;
    if (!props.wrap.value) return;

    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);

    if (!coords) {
      return;
    }

    const columnIndex = coords.columnIndex;
    const isShiftKey = e.shiftKey;
    const isMetaKey = e.ctrlKey || e.metaKey;
    startSelectedColumnIndex = columnIndex;

    if (selectedColumns.value.includes(columnIndex)) {
      return;
    }

    /* Shift key */
    if (isShiftKey) {
      appendAConnectedColumn(columnIndex);
      return;
    }

    //  判断当前是否已经在 selectedColumns 中
    if (selectedColumns.value.includes(columnIndex)) {
      //  拖拽效果
    } else {
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mousemove", handleMouseMove);

      //  为 meta key 追加添加选区进去
      if (isMetaKey) {
        const data = [...globalStore.selectedColumns];
        data.push(columnIndex);
        data.sort((a, b) => a - b);
        globalStore.selectedColumns = data;
        lastSelectionLength = data.length;
      } else {
        //  不是 meta key，清空之前的只保留当前
        globalStore.selectedColumns = [columnIndex];
        lastSelectionLength = 1;
      }

      isSelecting.value = true;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isSelecting) return;
    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);
    if (!coords) return;

    if (!~startSelectedColumnIndex) return;

    let selections: number[] = [];
    if (coords.columnIndex > startSelectedColumnIndex) {
      let lengths = coords.columnIndex - startSelectedColumnIndex;
      for (let i = 0; i <= lengths; i++) {
        selections.push(i + startSelectedColumnIndex);
      }
    } else {
      let lengths = startSelectedColumnIndex - coords.columnIndex;
      for (let i = 0; i <= lengths; i++) {
        selections.push(i + coords.columnIndex);
      }
    }

    if (selections.length === lastSelectionLength) {
      return;
    }
    lastSelectionLength = selections.length;

    globalStore.selectedColumns = selections;
  }

  function handleMouseUp() {
    isSelecting.value = false;
    startSelectedColumnIndex = -1;
    lastSelectionLength = 0;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  /**
   * 添加一个关联的选中 column，用户按下 shift 后再次点击 column 时调用
   * @param colIndex
   */
  function appendAConnectedColumn(colIndex: number) {
    let columnIndexs = [...selectedColumns.value].sort((a, b) => a - b);

    if (columnIndexs.length === 0) {
      globalStore.selectedColumns = [colIndex];
      return;
    }

    if (columnIndexs.length === 1 && columnIndexs[0] === colIndex) {
      return;
    }

    //  找到左侧最小的
    for (let i = 0; i < columnIndexs.length; i++) {
      let selectedIndex = columnIndexs[i];
      if (selectedIndex < colIndex) {
        let newSelectedIndexs: number[] = [];
        for (let j = selectedIndex; j <= colIndex; j++) {
          newSelectedIndexs.push(j);
        }

        globalStore.selectedColumns = newSelectedIndexs;
        return;
      }
    }

    let maxIndex = Math.max(...columnIndexs);

    //  找到右侧最小的
    for (let i = colIndex; i <= maxIndex; i++) {
      if (columnIndexs.includes(i) && i > colIndex) {
        let newSelectedIndexs: number[] = [];
        for (let j = colIndex; j <= i; j++) {
          newSelectedIndexs.push(j);
        }

        globalStore.selectedColumns = newSelectedIndexs;
        return;
      }
    }
  }

  /**
   * 根据选中的 columns 选择选区
   * @param selectedColumns
   */
  function updateSelections(selectedColumns: number[]) {
    if (selectedColumns.length === 0) return;

    //  [1,2,4,6,7,8] => [ [1,2] , [4] , [6,7,8] ]
    let twoDimensionArr: number[][] = [];
    selectedColumns = selectedColumns.sort((a, b) => a - b);

    for (let i = 0; i < selectedColumns.length; i++) {
      let num = selectedColumns[i];

      let relateArr: number[] = [];
      while (selectedColumns.includes(num)) {
        if (selectedColumns.includes(num)) {
          relateArr.push(num);
          i = selectedColumns.indexOf(num);
        }
        num++;
      }

      twoDimensionArr.push(relateArr);
    }

    //  生成 selections
    let selections: SelectionArea[] = [];

    twoDimensionArr.map((arr) => {
      let min = Math.min(...arr);
      let max = Math.max(...arr);
      selections.push({
        bounds: {
          left: min,
          right: max,
          top: 0,
          bottom: rowCount.value - 1,
        },
      });
    });

    setSelections(selections);
  }

  return {
    isSelecting,
  };
}
