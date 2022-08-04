import { defineComponent } from "vue";
import type { CellInterface } from "@/Cell/hooks/useCellRender";
import type { ShapeConfig } from "konva/lib/Shape";
import { KonvaEventObject } from "konva/lib/Node";
import { isNull } from "@/Grid/helpers";
import { useHelpers } from "@/hooks/useHelpers";

export interface CellPosition
  extends Pick<ShapeConfig, "x" | "y" | "width" | "height"> {}

export interface RendererProps
  extends CellInterface,
    CellPosition,
    Omit<ShapeConfig, "scale"> {
  id: any;
}

export interface CellProps extends RendererProps {
  value?: string;
  textColor?: string;
  padding?: number;
  fontWeight?: string;
  fontStyle?: string;
  onClick?: (e: KonvaEventObject<MouseEvent>) => void;
}

const Cell = defineComponent({
  name: "Cell",
  inheritAttrs: false,
  setup(props, { attrs }) {
    const { getCellValueByCrood } = useHelpers();

    const {
      x = 0,
      y = 0,
      width,
      height,
      fill = "white",
      strokeWidth = 1,
      stroke = "#d9d9d9",
      align = "left",
      verticalAlign = "middle",
      textColor = "#333",
      padding = 5,
      fontFamily = "Arial",
      fontSize = 12,
      children,
      wrap = "none",
      fontWeight = "normal",
      fontStyle = "normal",
      textDecoration,
      alpha = 1,
      strokeEnabled = true,
      globalCompositeOperation = "multiply",
      isOverlay,
      ...rest
    } = attrs as CellProps;

    const value = getCellValueByCrood(rest.rowIndex, rest.columnIndex);

    const fillEnabled = !!fill;
    const textStyle = `${fontWeight} ${fontStyle}`;

    const rectConfig = {
      x: x + 0.5,
      y: y + 0.5,
      height: height,
      width: width,
      fill: fill,
      stroke: stroke,
      strokeWidth: strokeWidth,
      shadowForStrokeEnabled: false,
      strokeScaleEnabled: false,
      hitStrokeWidth: 0,
      alpha: alpha,
      fillEnabled: fillEnabled,
      strokeEnabled: strokeEnabled,
    };

    const textConfig = {
      x: x + 0.5,
      y: y + 0.5,
      height: height,
      width: width,
      text: value,
      fill: textColor,
      verticalAlign: verticalAlign,
      align: align,
      fontFamily: fontFamily,
      fontStyle: textStyle,
      textDecoration: textDecoration,
      padding: padding,
      wrap: wrap,
      fontSize: fontSize,
      hitStrokeWidth: 0,
    };

    return () => (
      <v-group {...rest}>
        <v-rect config={rectConfig}></v-rect>
        {isNull(value) ? null : <v-text config={textConfig} />}
      </v-group>
    );
  },
});

export default Cell;
