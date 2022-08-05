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
