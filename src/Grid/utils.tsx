import { SelectionProps } from "$vct/types";
import { CSSProperties } from "vue";
import { styleAutoAddPx } from "$vct/utils";

export function createHTMLBox({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  stroke,
  strokeLeftColor = stroke,
  strokeTopColor = stroke,
  strokeRightColor = stroke,
  strokeBottomColor = stroke,
  strokeWidth = 0,
  strokeTopWidth = strokeWidth,
  strokeRightWidth = strokeWidth,
  strokeBottomWidth = strokeWidth,
  strokeLeftWidth = strokeWidth,
  key,
  strokeStyle = "solid",
  fillOpacity = 1,
  draggable,
  isDragging,
  borderCoverWidth = 5,
  type,
  bounds,
  activeCell,
  ...props
}: SelectionProps) {
  const lineStyles: Partial<CSSProperties> = {
    borderWidth: 0,
    position: "absolute",
    pointerEvents: "none",
  };
  /**
   * Border cover is so that there is enough
   * draggable handle area for the user.
   * Default is 5px
   */
  const showBorderCover = draggable;
  const borderCoverStyle: CSSProperties = {
    position: "absolute",
    pointerEvents: draggable ? "auto" : "none",
    cursor: draggable ? (isDragging ? "grabbing" : "grab") : "initial",
  };
  width = width - Math.floor(strokeWidth / 2);
  height = height - Math.floor(strokeWidth / 2);
  // y = y - Math.ceil(strokeWidth / 2);
  const lines = [
    <div
      style={styleAutoAddPx({
        ...lineStyles,
        left: x,
        top: y,
        width: width,
        height: strokeTopWidth,
        borderColor: strokeTopColor,
        borderTopWidth: strokeTopWidth,
        borderStyle: strokeStyle,
      })}
      key="top"
      {...props}
    />,
    <div
      style={styleAutoAddPx({
        ...lineStyles,
        left: x + width,
        top: y,
        width: strokeRightWidth,
        height: height,
        borderColor: strokeRightColor,
        borderRightWidth: strokeRightWidth,
        borderStyle: strokeStyle,
      })}
      key="right"
      {...props}
    />,
    <div
      style={styleAutoAddPx({
        ...lineStyles,
        left: x,
        top: y + height,
        width: width + strokeTopWidth,
        height: strokeBottomWidth,
        borderColor: strokeBottomColor,
        borderBottomWidth: strokeBottomWidth,
        borderStyle: strokeStyle,
      })}
      key="bottom"
      {...props}
    />,
    <div
      style={styleAutoAddPx({
        ...lineStyles,
        left: x,
        top: y,
        width: strokeLeftWidth,
        height: height,
        borderColor: strokeLeftColor,
        borderLeftWidth: strokeLeftWidth,
        borderStyle: strokeStyle,
      })}
      key="left"
      {...props}
    />,
  ];
  const borderCovers = [
    <div
      style={styleAutoAddPx({
        ...borderCoverStyle,
        left: x,
        top: y,
        width: width,
        height: 5,
      })}
      key="top"
      {...props}
    />,
    <div
      style={styleAutoAddPx({
        ...borderCoverStyle,
        left: x + width - borderCoverWidth + strokeRightWidth,
        top: y,
        width: borderCoverWidth,
        height: height,
      })}
      key="right"
      {...props}
    />,
    <div
      style={styleAutoAddPx({
        ...borderCoverStyle,
        left: x,
        top: y + height - borderCoverWidth + strokeBottomWidth,
        width: width + strokeTopWidth,
        height: borderCoverWidth,
      })}
      key="bottom"
      {...props}
    />,
    <div
      style={styleAutoAddPx({
        ...borderCoverStyle,
        left: x,
        top: y,
        width: borderCoverWidth,
        height: height,
      })}
      key="left"
      {...props}
    />,
  ];
  /**
   * Display title component
   * Only if title is not null
   */
  const titleProps = {
    isDragging,
    x,
    y,
    stroke: strokeTopColor,
    width,
    bounds,
    strokeWidth,
  };
  return (
    <>
      {fill && (
        <div
          style={styleAutoAddPx({
            position: "absolute",
            top: y,
            left: x,
            height,
            width,
            backgroundColor: fill,
            opacity: fillOpacity,
            userSelect: "none",
            pointerEvents: "none",
          })}
        />
      )}
      {lines}
      {showBorderCover && borderCovers}
    </>
  );
}

export const VNodes = (_, { attrs }) => {
  return attrs.vnodes;
};
