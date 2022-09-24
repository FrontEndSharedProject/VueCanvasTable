/**
 * 统计处理
 * 将用户输入的 columnStatistics 的 ** 配置 ** 数据
 * 进行统计后，通过 statisticsUpdate 事件返回统计后的结果
 * 用户可以通过 statisticsUpdate 结果来自定义 dom 展示统计信息
 */
import { inject, unref, watch } from "vue";
import { useGlobalStore } from "$vct/store/global";
import {
  CellInterface,
  StatisticsUpdatePayload,
  StatisticsUpdatePayloadItem,
} from "$vct/types";
import { useStore } from "$vct/hooks/useStore";
import { debounce } from "lodash-es";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { EventName, StatisticsType } from "$vct/enums";
import {
  flatSelectionsToCellInterfaceArr,
  getBoundedCells,
} from "$vct/helpers";
import { EventPayloadType, useEventBase } from "$vct/Grid/hooks/useEventBase";

export function useStatistics() {
  const globalStore = useGlobalStore();
  const { columns, frozenColumns, selections } = useStore();
  const eventBaseMethods = useEventBase();
  const {
    getColumnWidth,
    isHiddenColumn,
    getCellValueByCoord,
    getColumnOffset,
  } = useExpose();

  const update = debounce(_update, 1000);
  const updateSelectedStatistics = debounce(_updateSelectedStatistics, 600);

  watch(
    () => globalStore.columnStatistics,
    (val) => {
      update();
    },
    {
      immediate: true,
      deep: true,
    }
  );

  watch(
    () => globalStore._rows,
    () => {
      update();
    },
    {
      deep: true,
    }
  );

  watch(selections, () => {
    updateSelectedStatistics();
  });

  function _updateSelectedStatistics() {
    let cells: CellInterface[] = flatSelectionsToCellInterfaceArr(
      selections.value
    );

    const total = cells.length;
    const cellsValue = cells.map((cellCoor) => {
      let { rowIndex, columnIndex } = cellCoor;
      return getCellValueByCoord({
        rowIndex: rowIndex,
        columnIndex: columnIndex,
      });
    });

    const average = (
      cellsValue.reduce((prev, current) => {
        prev += isNaN(parseFloat(current)) ? 0 : parseFloat(current);
        return prev;
      }, 0) / total
    ).toFixed(2);

    const sumValue = cellsValue
      .reduce((prev, current) => {
        prev += isNaN(parseFloat(current)) ? 0 : parseFloat(current);
        return prev;
      }, 0)
      .toFixed(2);

    const payload: EventPayloadType<EventName.STATISTICS_SELECTION_UPDATE> = {
      sum: sumValue.toString(),
      average: average.toString(),
      count: total.toString(),
    };

    eventBaseMethods.emit(EventName.STATISTICS_SELECTION_UPDATE, payload);
  }

  function _update() {
    let statisticsPayload: EventPayloadType<EventName.STATISTICS_UPDATE> = [];

    for (let i = 0; i < columns.value.length; i++) {
      let col = columns.value[i];
      let type =
        globalStore.columnStatistics[col.id] ?? StatisticsType.DISABLED;
      const isFrozenColumn = i !== 0 && i < unref(frozenColumns);
      const isHidden = isHiddenColumn(i);

      let payload: StatisticsUpdatePayloadItem = {
        id: col.id,
        column: col,
        width: getColumnWidth(i),
        isFrozen: isFrozenColumn,
        left: getColumnOffset(i),
        isHidden: isHiddenColumn(i),
        type: type,
        value: isHidden ? "" : getColumnStatistics(i, type),
      };

      statisticsPayload.push(payload);
    }

    eventBaseMethods.emit(EventName.STATISTICS_UPDATE, statisticsPayload);
  }

  function getColumnStatistics(
    columnIndex: number,
    type: StatisticsType
  ): string {
    if (type === StatisticsType.DISABLED) {
      return "";
    }

    if (type === StatisticsType.HAVE_VALUE) {
      return globalStore._rows
        .reduce((prev, row, rowIndex) => {
          const value = getCellValueByCoord({
            rowIndex,
            columnIndex,
          });

          if (value.trim().length > 0) {
            prev += 1;
          }

          return prev;
        }, 0)
        .toString();
    }

    if (type === StatisticsType.EMPTY) {
      return globalStore._rows
        .reduce((prev, row, rowIndex) => {
          const value = getCellValueByCoord({
            rowIndex,
            columnIndex,
          });

          if (value.trim().length === 0) {
            prev += 1;
          }

          return prev;
        }, 0)
        .toString();
    }

    if (type === StatisticsType.SUM) {
      return globalStore._rows
        .reduce((prev, row, rowIndex) => {
          let value = parseFloat(
            getCellValueByCoord({
              rowIndex,
              columnIndex,
            })
          );

          value = isNaN(value) ? 0 : value;

          prev += value;

          return prev;
        }, 0)
        .toFixed(2)
        .toString();
    }

    if (type === StatisticsType.AVERAGE) {
      let totalValue = globalStore._rows.reduce((prev, row, rowIndex) => {
        let value = parseFloat(
          getCellValueByCoord({
            rowIndex,
            columnIndex,
          })
        );

        value = isNaN(value) ? 0 : value;

        prev += value;

        return prev;
      }, 0);

      return (totalValue / globalStore._rows.length).toFixed(2).toString();
    }

    if (type === StatisticsType.MAX) {
      let values = globalStore._rows.map((row, rowIndex) => {
        let value = parseFloat(
          getCellValueByCoord({
            rowIndex,
            columnIndex,
          })
        );
        return isNaN(value) ? 0 : value;
      });

      return Math.max(...values)
        .toFixed(2)
        .toString();
    }

    if (type === StatisticsType.MIN) {
      let values = globalStore._rows.map((row, rowIndex) => {
        let value = parseFloat(
          getCellValueByCoord({
            rowIndex,
            columnIndex,
          })
        );
        return isNaN(value) ? 0 : value;
      });

      return Math.min(...values)
        .toFixed(2)
        .toString();
    }

    return "";
  }
}
