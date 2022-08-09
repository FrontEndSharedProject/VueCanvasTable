/**
 * 该文件用于处理 字段分组 数据
 */
import { useGlobalStore } from "@/store/global";
import { computed, ComputedRef, unref } from "vue";
import { Row } from "@/Grid/types";

export type ColumnGroupProps = {
  cellValue: string;
  column: string;
  haveChildren: boolean;
  rows: Row[];
  count: number;
  rect: {
    x: number;
    y: number;
    height: number;
    width: number;
    offsetTop: number;
    offsetLeft: number;
  };
  children: ColumnGroupProps[];
};

export type ColumnGroupStructure = ColumnGroupProps[];

type ReturnType = {
  rowsData: ComputedRef<Row[]>;
  columnGroupStructure: ComputedRef<ColumnGroupStructure | null>;
  rowsOffsetTops: ComputedRef<number[]>;
};

//  group 距离顶部的偏移值（相对位置）
const groupOffsetTop: number = 16;
//  group height 高度
const groupHeaderHeight: number = 50;
//  group 缩进值
const groupIndentWidth: number = 14;

export function useColumnsGroupData(): ReturnType {
  const globalStore = useGlobalStore();

  const columnGroupDataComputed = computed<
    [null, null] | [Row[], ColumnGroupStructure]
  >(() => {
    if (globalStore.columnGroups && globalStore.columnGroups.enable) {
      if (globalStore.columnGroups.configs.length > 0) {
        let column = globalStore.columnGroups.configs[0].column;

        //  首先进行第一层分组
        let groups: Record<string, Row[]> = {};
        let length = globalStore._rows.length;
        for (let i = 0; i < length; i++) {
          let row = globalStore._rows[i];
          let cellValue = row.fields[column];
          groups[cellValue] = groups[cellValue] || [];
          groups[cellValue].push(row);
        }

        let _groups: ColumnGroupStructure = [];
        _groups = Object.keys(groups).reduce<ColumnGroupStructure>(
          (prev, groupCellValue, currentIndex) => {
            let groupProps: ColumnGroupProps = {
              cellValue: groupCellValue as string,
              column: column as string,
              rows: groups[groupCellValue] as Row[],
              children: [],
              haveChildren: false,
              count: 0,
              rect: {
                x: 0,
                y: 0,
                offsetLeft: 0,
                offsetTop: 0,
                width: 0,
                height: 0,
              },
            };

            prev.push(groupProps);

            return prev;
          },
          []
        );

        //  二次分组
        if (globalStore.columnGroups.configs[1]) {
          let column = globalStore.columnGroups.configs[1].column;
          _groups.map((groupProps) => {
            groupProps.children = groupDataByColumn(
              groupProps.rows as Row[],
              column
            );
            groupProps.haveChildren = true;
          });
        }

        //  三次分组
        if (globalStore.columnGroups.configs[2]) {
          let column = globalStore.columnGroups.configs[2].column;
          _groups.map((groupProps) => {
            groupProps.children.map((_groupProps) => {
              _groupProps.children = groupDataByColumn(
                _groupProps.rows,
                column
              );
              _groupProps.haveChildren = true;
            });
          });
        }

        //  计算每个分组的总数
        setGroupsCount(_groups);

        //  计算每个分组 ui 的数值
        setGroupRect(_groups);

        console.log(_groups)

        return [getRows(_groups), _groups];
      }

      return [null, null];
    }

    return [null, null];
  });

  const rowsData = computed(() => {
    if (globalStore.columnGroups && globalStore.columnGroups.enable) {
      if (globalStore.columnGroups.configs.length > 0) {
        return columnGroupDataComputed.value[0];
      }

      return globalStore._rows;
    } else {
      return globalStore._rows;
    }
  });

  const columnGroupStructure = computed<null | ColumnGroupStructure>(() => {
    if (globalStore.columnGroups && globalStore.columnGroups.enable) {
      if (globalStore.columnGroups.configs.length > 0) {
        return columnGroupDataComputed.value[1];
      }
    }

    return null;
  });

  //  计算出每行的头部偏移值
  const rowsOffsetTops = computed<number[]>(() => {
    if (globalStore.columnGroups && globalStore.columnGroups.enable) {
      if (globalStore.columnGroups.configs.length > 0) {
        const structure = unref(columnGroupStructure);
        if (structure) {
          return getRowOffsetTopByGroupConfig(structure);
        }
      }
    }

    return Array(rowsData.value.length).fill(0);
  });

  /**
   * 计算出每行的偏移值用于 rows 在表格中渲染
   */
  function getRowOffsetTopByGroupConfig(
    structure: ColumnGroupStructure
  ): number[] {
    return structure.reduce<number[]>((prev, current, currentIndex) => {
      if (current.haveChildren) {
        //  遍历第二层
        for (
          let secondIndex = 0;
          secondIndex < current.children.length;
          secondIndex++
        ) {
          let secondGroupConfig = current.children[secondIndex];
          if (secondGroupConfig.haveChildren) {
            //  遍历第三层
            for (
              let thirdIndex = 0;
              thirdIndex < secondGroupConfig.children.length;
              thirdIndex++
            ) {
              let thirdGroupConfig = secondGroupConfig.children[thirdIndex];

              prev.push(
                ...Array(thirdGroupConfig.rows.length).fill(
                  thirdGroupConfig.rect.y +
                    groupHeaderHeight +
                    thirdGroupConfig.rect.offsetTop
                )
              );
            }
          } else {
            prev.push(
              ...Array(secondGroupConfig.rows.length).fill(
                secondGroupConfig.rect.y +
                  groupHeaderHeight +
                  secondGroupConfig.rect.offsetTop
              )
            );
          }
        }
      } else {
        prev.push(
          ...Array(current.rows.length).fill(
            (currentIndex + 1) * groupOffsetTop +
              groupHeaderHeight * (currentIndex + 1)
          )
        );
      }

      return prev;
    }, []);
  }

  function groupDataByColumn(array: Row[], column): ColumnGroupProps[] {
    let data = array;
    let _groups = {};
    let length = data.length;
    for (let i = 0; i < length; i++) {
      let row = data[i];
      let cellValue = row.fields[column];
      _groups[cellValue] = _groups[cellValue] || [];
      _groups[cellValue].push(row);
    }

    return Object.keys(_groups).reduce<ColumnGroupProps[]>(
      (prev, groupCellValue) => {
        let groupProps: ColumnGroupProps = {
          cellValue: groupCellValue,
          column: column,
          rows: _groups[groupCellValue],
          children: [],
          haveChildren: false,
          count: 0,
          rect: {
            offsetLeft: 0,
            offsetTop: 0,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          },
        };

        prev.push(groupProps);

        return prev;
      },
      []
    );
  }

  /**
   * 递归统计每个分组的总数
   * @param groups
   */
  function setGroupsCount(groups: ColumnGroupStructure) {
    groups.map((groupProps) => {
      groupProps.count = groupProps.rows.length;
    });
  }

  /**
   * 计算每个分组所需要的 ui 数值
   * @param groups
   */
  function setGroupRect(groups: ColumnGroupStructure) {
    let groupTopStack: number = 0;
    for (let firstIndex = 0; firstIndex < groups.length; firstIndex++) {
      let groupConfig = groups[firstIndex];
      groupConfig.rect.offsetTop = groupOffsetTop;
      groupConfig.rect.offsetLeft = groupIndentWidth * 0;
      groupConfig.rect.height =
        getGroupRowsTotalHeight(groupConfig.rows) +
        getChildrenGroupHeight(groupConfig) +
        groupHeaderHeight +
        groupOffsetTop;
      groupConfig.rect.width =
        unref(globalStore.scrollState.contentWidth) -
        groupConfig.rect.offsetLeft;
      groupConfig.rect.x = 0;
      groupConfig.rect.y = groupTopStack;

      //  计算二级分组
      if (groupConfig.haveChildren) {
        let secondGroupTopStack =
          groupConfig.rect.offsetTop + groupHeaderHeight;
        for (
          let secondIndex = 0;
          secondIndex < groupConfig.children.length;
          secondIndex++
        ) {
          let secondGroupConfig = groupConfig.children[secondIndex];

          secondGroupConfig.rect.offsetTop =
            secondIndex === 0 ? 0 : groupOffsetTop;
          secondGroupConfig.rect.offsetLeft = groupIndentWidth * 1;
          secondGroupConfig.rect.height =
            getGroupRowsTotalHeight(secondGroupConfig.rows) +
            getChildrenGroupHeight(secondGroupConfig) +
            groupHeaderHeight +
            secondGroupConfig.rect.offsetTop;
          secondGroupConfig.rect.width =
            unref(globalStore.scrollState.contentWidth) -
            secondGroupConfig.rect.offsetLeft;
          secondGroupConfig.rect.x = 0;
          secondGroupConfig.rect.y = groupConfig.rect.y + secondGroupTopStack;

          //  计算三级分组
          if (secondGroupConfig.haveChildren) {
            let thirdGroupTopStack =
              secondGroupConfig.rect.y + groupHeaderHeight;
            for (
              let thirdIndex = 0;
              thirdIndex < secondGroupConfig.children.length;
              thirdIndex++
            ) {
              let thirdGroupConfig = secondGroupConfig.children[thirdIndex];

              thirdGroupConfig.rect.offsetTop =
                thirdIndex === 0 ? 0 : groupOffsetTop;
              thirdGroupConfig.rect.offsetLeft = groupIndentWidth * 2;
              thirdGroupConfig.rect.height =
                getGroupRowsTotalHeight(thirdGroupConfig.rows) +
                getChildrenGroupHeight(thirdGroupConfig) +
                groupHeaderHeight +
                thirdGroupConfig.rect.offsetTop;
              thirdGroupConfig.rect.x = 0;
              thirdGroupConfig.rect.y =
                secondGroupConfig.rect.y + thirdGroupTopStack;
              thirdGroupConfig.rect.width =
                unref(globalStore.scrollState.contentWidth) -
                groupIndentWidth * 2;

              thirdGroupTopStack =
                thirdGroupConfig.rect.y + thirdGroupConfig.rect.height;
            }
          }

          secondGroupTopStack =
            secondGroupConfig.rect.y + secondGroupConfig.rect.height;
        }
      }

      groupTopStack = groupConfig.rect.y + groupConfig.rect.height;
    }
  }

  /**
   * 获取第一层分组中，子分组的标题与 offsetTop 总和
   * @param groupConfig
   */
  function getChildrenGroupHeight(groupConfig: ColumnGroupProps): number {
    let totalHeight: number = 0;

    if (groupConfig.haveChildren) {
      let childrenLength = groupConfig.children.length;
      totalHeight +=
        childrenLength * groupHeaderHeight +
        (childrenLength - 1) * groupOffsetTop;

      for (let i = 0; i < groupConfig.children.length; i++) {
        let children = groupConfig.children[i];
        totalHeight += getChildrenGroupHeight(children);
      }
    }

    return totalHeight;
  }

  function getGroupRowsTotalHeight(rows: Row[]): number {
    return rows.reduce((prev, current) => {
      let index = unref(globalStore._rows).findIndex(
        (r) => r.id === current.id
      );
      let rowHeight = unref(globalStore.rowHeights)[index];

      return prev + rowHeight;
    }, 0);
  }

  /**
   * 递归获取 row 数据
   * @param groups
   * @param data
   */
  function getRows(groups: ColumnGroupStructure, data: Row[] = []) {
    groups.map((groupProps) => {
      data.push(...groupProps.rows);
    });
    return data;
  }

  return {
    rowsData,
    columnGroupStructure,
    rowsOffsetTops,
  };
}
