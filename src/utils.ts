import { CSSProperties } from "vue";

const cssNumbers = {
  animationIterationCount: true,
  columnCount: true,
  fillOpacity: true,
  flexGrow: true,
  flexShrink: true,
  fontWeight: true,
  gridArea: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnStart: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowStart: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  widows: true,
  zIndex: true,
  zoom: true,
};

/**
 * 自动给 css 属性添加 px 后缀
 * @param css
 */
export function styleAutoAddPx(css: CSSProperties): CSSProperties {
  return Object.keys(css).reduce((prev, current) => {
    let key = current;
    let value: any = css[current];

    if (typeof value === "number" && !cssNumbers[key]) {
      //  @ts-ignore
      value += "px";
    }
    prev[key] = value;
    return prev;
  }, {});
}

/**
 * 数组元素s位置移动
 * @param arr 数组
 * @param elsStartPosition 元素开始的位置
 * @param length 需要移动元素的长度
 * @param destPosition 最终要放入的位置
 */
export function arrayElsPositionMove<T>(
  arr: T[],
  elsStartPosition: number,
  length: number,
  destPosition: number
): T[] {
  let targetItems = arr.splice(elsStartPosition, length);

  let tmpArr: T[] = [];

  //  由于 splice 后，位置改变了，这里的 destPosition 也要改
  if (elsStartPosition < destPosition) {
    destPosition = destPosition - (length - 1);
  }

  if (destPosition >= arr.length) {
    arr.push(...targetItems);
    tmpArr = arr;
  } else {
    for (let i = 0; i < arr.length; i++) {
      let item = arr[i];

      if (destPosition === i) {
        tmpArr.push(...targetItems);
      }

      tmpArr.push(item);
    }
  }

  return tmpArr;
}

/**
 * 判断 el 是否包含 className 或者是 className 元素的只级
 * 多用于 click outside 判断
 * @param el
 * @param className
 * @constructor
 */
export function isElementContainsClassOrIsChildOf(
  el: Element,
  className: string
): boolean {
  return el.classList.contains(className) || !!el.closest(`.${className}`);
}

/**
 * 将范围数组展开
 * [ [1,3], [5,8], [9,9] ] => [1,2,3,5,6,7,8,9]
 */
export function arrayFlatFromRage(rageArr: number[][]): number[] {
  let flattedArr: number[] = [];
  for (let i = 0; i < rageArr.length; i++) {
    let [start, end] = rageArr[i];

    for (let j = start; j <= end; j++) {
      flattedArr.push(j);
    }
  }

  return Array.from(new Set(flattedArr)).sort();
}

/**
 * transform coords to two dimensional array
 *
 * [
 *  {x:2,y:2}
 * ]
 *
 * =>
 *
 * [
 *    [ undefined, undefined, undefined ]
 *    [ undefined, undefined, undefined ]
 *    [ undefined, undefined, {x:2, y:2} ]
 * ]
 * @param coords
 */
export function coordsTo2dArray<T>(
  coords: Array<{ x: number; y: number } & T>,
  cb?: (coord: T) => any
): (T & any)[][] {
  const maxPosition = coords.reduce(
    (reduceData, { x, y }) => {
      reduceData.max_x = Math.max(reduceData.max_x, x);
      reduceData.min_x = Math.min(reduceData.min_x, x);
      reduceData.max_y = Math.max(reduceData.max_y, y);
      reduceData.min_y = Math.min(reduceData.min_y, y);
      return reduceData;
    },
    { max_x: 0, max_y: 0, min_x: 99999, min_y: 99999 }
  );

  const _x = maxPosition.max_x - maxPosition.min_x;
  const _y = maxPosition.max_y - maxPosition.min_y;

  const output = new Array(_y + 1).fill("").map((empty, y) => {
    return new Array(_x + 1).fill("").map((_empty, x) => {
      const current_x = x + maxPosition.min_x;
      const current_y = y + maxPosition.min_y;
      const target = coords.find((item) => {
        return item.x === current_x && item.y === current_y ? item : false;
      });

      let res = target ?? { x: current_x, y: current_y };
      //  @ts-ignore
      return cb ? cb(res) : res;
    });
  });

  return output;
}
