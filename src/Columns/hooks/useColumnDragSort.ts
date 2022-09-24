import { onBeforeUnmount, onMounted, ref, Ref } from "vue";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { useStore } from "$vct/hooks/useStore";
import { useDimensions } from "$vct/hooks/useDimensions";
import { Direction } from "$vct/enums";
import { sum } from "lodash-es";
import { useGlobalStore } from "$vct/store/global";

type Props = {
  wrap: HTMLDivElement;
};

type ReturnType = {
  isDragging: Ref<boolean>;
  offsetLeft: Ref<number>;
  draggingColumnIndexs: Ref<number[]>;
  insertLineLeft: Ref<number>;
};

export function useColumnDragSort(props: Props): ReturnType {
  const globalStore = useGlobalStore();
  const {
    getCellCoordsFromOffset,
    getColumnOffset,
    getColumnWidth,
    setColumnsPosition,
    setSelections,
  } = useExpose();
  const {
    selectedColumns,
    tableRef,
    scrollState,
    columns,
    rowCount,
    columnCount,
  } = useStore();
  const { rowHeaderWidth, stageWidth, scrollbarSize } = useDimensions();
  let startSelectedColumnIndex = -1;
  let lastSelectionLength: number = 0;
  let startDragX: number = 0;
  let startOffsetLeft: number = 0;
  let mouseMoveRef: any = null;
  let lastMouseLeft: number = 0;
  let direction: Direction = Direction.Left;
  let minimumOffsetLeft: number = 0;
  let maximumOffsetLeft: number = 0;

  const isDragging = ref<boolean>(false);
  const offsetLeft = ref<number>(-1);
  const draggingColumnIndexs = ref<number[]>([]);
  const insertIndex = ref<number>(-1);
  const insertLineLeft = ref<number>(-1);

  onMounted(() => {
    if (props.wrap) {
      props.wrap.addEventListener("mousedown", handleMouseDown);
    }
  });

  onBeforeUnmount(() => {
    if (props.wrap) {
      props.wrap.removeEventListener("mousedown", handleMouseDown);
    }
  });

  function handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLDivElement;
    if (e.buttons !== 1) return;
    if (target.classList.contains("resize-grabber")) return;
    if (!props.wrap) return;
    if (!tableRef.value) return;
    const coords = getCellCoordsFromOffset(e.clientX, e.clientY);
    if (!coords) return;

    const columnIndex = coords.columnIndex;

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);

    //  判断当前是否已经在 selectedColumns 中
    if (selectedColumns.value.includes(columnIndex)) {
      //  找到当前 column 附近的 column
      //  [1,2,4,6,7,8] => [ [1,2] , [4] , [6,7,8] ]
      let twoDimensionArr: number[][] = [];
      selectedColumns.value.sort((a, b) => a - b);

      for (let i = 0; i < selectedColumns.value.length; i++) {
        let num = selectedColumns.value[i];

        let relateArr: number[] = [];
        while (selectedColumns.value.includes(num)) {
          if (selectedColumns.value.includes(num)) {
            relateArr.push(num);
            i = selectedColumns.value.indexOf(num);
          }
          num++;
        }

        twoDimensionArr.push(relateArr);
      }

      const closeArr: number[] = twoDimensionArr.find((arr) =>
        arr.includes(coords.columnIndex)
      ) as number[];
      const draggingColumnTotalWidths = closeArr.reduce((prev, current) => {
        prev += getColumnWidth(current);
        return prev;
      }, 0);
      const { left, width } = tableRef.value.getBoundingClientRect();

      startSelectedColumnIndex = closeArr[0];
      draggingColumnIndexs.value = closeArr;
      startDragX = e.clientX;
      lastMouseLeft = e.clientX;
      startOffsetLeft =
        getColumnOffset(closeArr[0]) -
        scrollState.value.scrollLeft +
        rowHeaderWidth.value;
      offsetLeft.value = startOffsetLeft;

      minimumOffsetLeft = rowHeaderWidth.value;
      maximumOffsetLeft =
        stageWidth.value - draggingColumnTotalWidths - 1;

      isDragging.value = true;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (mouseMoveRef) return;
    if (!isDragging.value) return;

    mouseMoveRef = window.requestAnimationFrame(() => {
      mouseMoveRef = null;
      if (!tableRef.value) return;
      direction =
        e.clientX - lastMouseLeft > 0 ? Direction.Right : Direction.Left;

      const newOffsetLeft = startOffsetLeft + (e.clientX - startDragX);
      if (newOffsetLeft < minimumOffsetLeft) return;
      if (newOffsetLeft > maximumOffsetLeft) return;

      if (Math.abs(e.clientX - lastMouseLeft) > 30) {
        lastMouseLeft = e.clientX;
      }

      //  计算是否有在 其他 column 上
      const { left, top } = tableRef.value.getBoundingClientRect();
      const columnsWidth: number = sum(
        draggingColumnIndexs.value.map((index) => {
          return columns.value[index].width;
        })
      );
      let edgeLeft =
        direction === Direction.Left
          ? newOffsetLeft + left
          : newOffsetLeft + left + columnsWidth;
      offsetLeft.value = newOffsetLeft;

      const coords = getCellCoordsFromOffset(edgeLeft, top + 10);
      if (coords) {
        if (!draggingColumnIndexs.value.includes(coords.columnIndex)) {
          insertIndex.value = coords.columnIndex;

          let targetColumnOffsetLeft = getColumnOffset(insertIndex.value);

          let offsetLeft =
            targetColumnOffsetLeft -
            scrollState.value.scrollLeft +
            rowHeaderWidth.value;

          let left =
            direction === Direction.Left
              ? offsetLeft
              : offsetLeft + getColumnWidth(insertIndex.value);

          //  如果超出右侧的话就不显示了
          if (left > stageWidth.value) {
            insertLineLeft.value = -1;
          } else {
            insertLineLeft.value = left;
          }
        }
      }
    });
  }

  function handleMouseUp() {
    if (
      insertIndex.value !== -1 &&
      startSelectedColumnIndex !== -1 &&
      draggingColumnIndexs.value.length > 0
    ) {
      let firstColumn = columns.value[draggingColumnIndexs.value[0]];
      let lastColumn =
        columns.value[
          draggingColumnIndexs.value[draggingColumnIndexs.value.length - 1]
        ];

      setColumnsPosition(
        startSelectedColumnIndex,
        draggingColumnIndexs.value.length,
        insertIndex.value
      );

      //  设置 column 选中
      let selectedColumnsIndex: number[] = [];
      let leftIndex: number = columns.value.findIndex(
        (c) => c.id === firstColumn.id
      );
      let rightIndex: number = columns.value.findIndex(
        (c) => c.id === lastColumn.id
      );

      for (let i = leftIndex; i <= rightIndex; i++) {
        selectedColumnsIndex.push(i);
      }
      globalStore.selectedColumns = selectedColumnsIndex;
    }

    isDragging.value = false;
    startSelectedColumnIndex = -1;
    lastSelectionLength = 0;
    draggingColumnIndexs.value = [];
    offsetLeft.value = -1;
    insertLineLeft.value = -1;
    insertIndex.value = -1;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  return {
    isDragging,
    offsetLeft,
    draggingColumnIndexs,
    insertLineLeft,
  };
}
