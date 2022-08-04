import { styleAutoAddPx } from "@/utils";
import { VNode } from "vue";

/**
 * Fill handle component
 */
export function FillHandler({
  x = 0,
  y = 0,
  stroke,
  strokeWidth = 1,
  size = 8,
  borderColor,
  ...props
}): VNode {
  if (x === 0 || y === 0) return <></>;
  return (
    <div
      style={styleAutoAddPx({
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        border: `${strokeWidth}px ${borderColor} solid`,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        background: stroke,
        cursor: "crosshair",
        pointerEvents: "all",
      })}
      {...props}
    />
  );
}
