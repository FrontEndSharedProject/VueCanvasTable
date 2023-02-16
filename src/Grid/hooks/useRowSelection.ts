import { onBeforeUnmount, onMounted, ref, Ref, watch } from "vue";
import { useStore } from "$vct/hooks/useStore";
import { isElementContainsClassOrIsChildOf } from "$vct/utils";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useGlobalStore } from "$vct/store/global";
import { useDimensions } from "$vct/hooks/useDimensions";
import { SelectionArea } from "$vct/types";
import { ClassNameEnum } from "$vct/enums";

type Props = {
  wrap: Ref<HTMLDivElement | undefined>;
};

export function useRowSelection(props: Props) {
  const globalStore = useGlobalStore();
  const { stageContainerRef, selectedRows, columnCount, selections } =
    useStore();
  const {
    getCellCoordsFromOffset,
    setSelections,
    getRelativePositionFromOffset,
  } = useExpose();
  const { rowHeaderWidth, stageHeight } = useDimensions();

  let startSelectedRowIndex = -1;
  let lastSelectionLength: number = 0;
  const isSelecting = ref<boolean>(false);

  watch(selectedRows, (val) => {
    updateSelections(val);
  });

  watch(selections, (val) => {
    if (val.length === 0) {
      globalStore.selectedRows = [];
      return;
    }

    //  检测是否为全选 left:0 right: columnCount - 1
    val.map((selection) => {
      const bounds = selection.bounds;
      if (bounds.left !== 0 || bounds.right !== columnCount.value - 1) {
        for (let start = bounds.top; start <= bounds.bottom; start++) {
          let rowIndex = start;
          if (globalStore.selectedRows.includes(rowIndex)) {
            let index = globalStore.selectedRows.indexOf(rowIndex);
            globalStore.selectedRows.splice(index, 1);
          }
        }
      }
    });
  });

  onMounted(() => {
    if (props.wrap.value) {
      props.wrap.value?.addEventListener("mousedown", handleMouseDown);
    }
  });

  onBeforeUnmount(() => {
    if (props.wrap.value) {
      props.wrap.value?.removeEventListener("mousedown", handleMouseDown);
    }
  });

  function handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLDivElement;
    if (e.buttons !== 1) return;
    if (!props.wrap.value) return;
    if (!stageContainerRef.value) return;
    if (
      !isElementContainsClassOrIsChildOf(
        target,
        stageContainerRef.value.classList[0]
      ) ||
      isElementContainsClassOrIsChildOf(target, ClassNameEnum.CELL_EDIT_BOX) ||
      isElementContainsClassOrIsChildOf(target, ClassNameEnum.CELL_TOOLTIP_WRAP)
    )
      return;
    const { x } = props.wrap.value.getBoundingClientRect();
    if (e.clientX > x + rowHeaderWidth.value) return;
    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);

    if (!coords) {
      return;
    }

    const rowIndex = coords.rowIndex;
    const isShiftKey = e.shiftKey;
    const isMetaKey = e.ctrlKey || e.metaKey;
    startSelectedRowIndex = rowIndex;

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);

    isSelecting.value = true;

    /* Shift key */
    if (isShiftKey) {
      appendAConnectedRow(rowIndex);
      return;
    }

    //  判断当前是否已经在 selectedRows 中
    if (selectedRows.value.includes(rowIndex)) {
      //  拖拽效果 ?
      //  todo 到底是拖拽还是取消选中
      let index = globalStore.selectedRows.indexOf(rowIndex);
      globalStore.selectedRows.splice(index, 1);
      setSelections([]);
    } else {
      //  为 meta key 追加添加选区进去
      //  不需要快捷键也可以添加多行
      if (isMetaKey || true) {
        const data = [...globalStore.selectedRows];
        data.push(rowIndex);
        data.sort((a, b) => a - b);
        globalStore.selectedRows = data;
        lastSelectionLength = data.length;
      } else {
        //  不是 meta key，清空之前的只保留当前
        globalStore.selectedRows = [rowIndex];
        lastSelectionLength = 1;
      }
    }
  }

  /**
   * 添加一个关联的选中 row，用户按下 shift 后再次点击 row 时调用
   * @param rowIndex
   */
  function appendAConnectedRow(rowIndex: number) {
    let rowIndexs = [...selectedRows.value].sort((a, b) => a - b);

    if (rowIndexs.length === 0) {
      globalStore.selectedRows = [rowIndex];
      return;
    }

    if (rowIndexs.length === 1 && rowIndexs[0] === rowIndex) {
      return;
    }

    //  找到左侧最小的
    for (let i = 0; i < rowIndexs.length; i++) {
      let selectedIndex = rowIndexs[i];
      if (selectedIndex < rowIndex) {
        let newSelectedIndexs: number[] = [];
        for (let j = selectedIndex; j <= rowIndex; j++) {
          newSelectedIndexs.push(j);
        }

        globalStore.selectedRows = newSelectedIndexs;
        return;
      }
    }

    let maxIndex = Math.max(...rowIndexs);

    //  找到右侧最小的
    for (let i = rowIndex; i <= maxIndex; i++) {
      if (rowIndexs.includes(i) && i > rowIndex) {
        let newSelectedIndexs: number[] = [];
        for (let j = rowIndex; j <= i; j++) {
          newSelectedIndexs.push(j);
        }

        globalStore.selectedRows = newSelectedIndexs;
        return;
      }
    }
  }

  function handleMouseUp() {
    isSelecting.value = false;
    startSelectedRowIndex = -1;
    lastSelectionLength = 0;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isSelecting) return;
    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);
    if (!coords) return;

    if (!~startSelectedRowIndex) return;

    let selections: number[] = [];
    if (coords.rowIndex > startSelectedRowIndex) {
      let lengths = coords.rowIndex - startSelectedRowIndex;
      for (let i = 0; i <= lengths; i++) {
        selections.push(i + startSelectedRowIndex);
      }
    } else {
      let lengths = startSelectedRowIndex - coords.rowIndex;
      for (let i = 0; i <= lengths; i++) {
        selections.push(i + coords.rowIndex);
      }
    }

    if (selections.length === lastSelectionLength) {
      return;
    }
    lastSelectionLength = selections.length;

    globalStore.selectedRows = selections;
  }

  /**
   * 根据选中的 rows 选择选区
   * @param selectedRows
   */
  function updateSelections(selectedRows: number[]) {
    if (selectedRows.length === 0) return;

    //  [1,2,4,6,7,8] => [ [1,2] , [4] , [6,7,8] ]
    let twoDimensionArr: number[][] = [];
    selectedRows = selectedRows.sort((a, b) => a - b);

    for (let i = 0; i < selectedRows.length; i++) {
      let num = selectedRows[i];

      let relateArr: number[] = [];
      while (selectedRows.includes(num)) {
        if (selectedRows.includes(num)) {
          relateArr.push(num);
          i = selectedRows.indexOf(num);
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
          left: 0,
          right: columnCount.value - 1,
          top: min,
          bottom: max,
        },
      });
    });

    setSelections(selections);
  }
}
