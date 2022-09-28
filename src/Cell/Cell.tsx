import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  toRaw,
  unref,
  watch,
} from "vue";
import { isNull } from "$vct/helpers";
import { Column } from "$vct/Grid/types";
import { useDataVerification } from "$vct/Grid/hooks/useDataVerification";
import { useStore } from "$vct/hooks/useStore";
import { useExpose } from "$vct/Grid/hooks/useExpose";
import { ShapeConfig } from "$vct/types";
import { useGlobalStore } from "$vct/store/global";

export interface CellPosition
  extends Pick<ShapeConfig, "x" | "y" | "width" | "height"> {}

export interface RendererProps {
  key: string;
  rowIndex: number;
  columnIndex: number;
  readonly: boolean;
  id: string;
  column: Column;
  x: number;
  y: number;
  width: number;
  height: number;
}

const Cell = defineComponent({
  name: "Cell",
  inheritAttrs: false,
  props: {
    renderProps: Object as PropType<RendererProps>,
  },
  setup(props, { attrs }) {
    const globalStore = useGlobalStore();
    const {
      getCellValueByCoord,
      isHaveNote,
      getColumnByColIndex,
      getColumnDataTransformer,
    } = useExpose();
    const { verify } = useDataVerification();
    const { themes, rows } = useStore();

    const groupRef = ref();

    const {
      x = 0,
      y = 0,
      width,
      height,
      column,
      readonly,
      rowIndex,
      columnIndex,
      ...rest
    } = props.renderProps as RendererProps;

    const {
      fill = "transparent",
      strokeWidth = 1,
      stroke = themes.value.lineColor,
      align = "left",
      verticalAlign = "middle",
      textColor = "#333",
      padding = 5,
      fontFamily = "Arial",
      fontSize = 12,
      wrap = "none",
      fontWeight = "normal",
      fontStyle = "normal",
      alpha = 1,
      strokeEnabled = true,
      globalCompositeOperation = "multiply",
    } = {};

    const value = computed(() => {
      return getCellValueByCoord({ rowIndex, columnIndex }, false);
    });

    const haveNote = computed(() => isHaveNote({ rowIndex, columnIndex }));

    const fillEnabled = !!fill;
    const textStyle = `${fontWeight} ${fontStyle}`;

    const render = toRaw(column.cellRenderer);
    const isHaveDataVerificationError = computed(() => {
      if (column.dataVerification) {
        return !!verify(value.value, column.dataVerification);
      }

      return false;
    });

    //  处理第一行 与 column 边框重叠问题
    const _y = rowIndex === 0 ? y - 0.5 : y + 0.5;
    const _h = rowIndex === 0 ? height + 1 : height;

    let defaultShapeConfigs: {
      backgroundRect: ShapeConfig;
      defaultText: ShapeConfig;
    } = {
      backgroundRect: {
        x: x,
        y: _y,
        height: _h,
        width: width + 0.5,
        fill: readonly ? "#F6F6F8" : fill,
        stroke: stroke,
        strokeWidth: strokeWidth,
        shadowForStrokeEnabled: false,
        strokeScaleEnabled: false,
        hitStrokeWidth: 0,
        fillEnabled: fillEnabled,
        strokeEnabled: strokeEnabled,
        alpha,
      },
      defaultText: {
        x: x + 0.5,
        y: y + 0.5,
        height: height,
        width: width,
        fill: textColor,
        verticalAlign: verticalAlign,
        align: align,
        fontFamily: fontFamily,
        fontStyle: textStyle,
        padding: padding,
        wrap: wrap,
        fontSize: fontSize,
        hitStrokeWidth: 0,
      },
    };

    //  提供 hook 已达到外部修改默认样式
    defaultShapeConfigs = globalStore.onCellBeforeRender
      ? globalStore.onCellBeforeRender(
          defaultShapeConfigs,
          value.value,
          props.renderProps
        )
      : defaultShapeConfigs;

    const dataVerificationErrorDot = {
      x: x + 1,
      y: y + 1,
      fill: themes.value.dangerColor,
      strokeWidth: 0,
      points: [0, 0, 5, 0, 0, 5],
      closed: true,
    };

    const commentTriangle = {
      x: x + width - 5,
      y: y + 1,
      fill: themes.value.textColor2,
      strokeWidth: 0,
      points: [5, 0, 5, 5, 0, 0],
      closed: true,
    };

    return () => (
      <v-group {...rest} key={x} ref={groupRef}>
        <v-rect
          config={defaultShapeConfigs.backgroundRect}
          listening={false}
          shadowForStrokeEnabled={false}
          hitStrokeWidth={0}
        />

        {isNull(unref(value)) ? null : (
          <>
            {render ? (
              <render value={value} renderProps={props.renderProps} defaultTextConfig={defaultShapeConfigs.defaultText} />
            ) : (
              <v-text
                text={value.value}
                listening={false}
                config={defaultShapeConfigs.defaultText}
                shadowForStrokeEnabled={false}
                hitStrokeWidth={0}
              />
            )}
          </>
        )}

        {isHaveDataVerificationError.value && (
          <v-line
            config={dataVerificationErrorDot}
            listening={false}
            shadowForStrokeEnabled={false}
            hitStrokeWidth={0}
          />
        )}

        {haveNote.value && (
          <v-line
            config={commentTriangle}
            listening={false}
            shadowForStrokeEnabled={false}
            hitStrokeWidth={0}
          />
        )}
      </v-group>
    );
  },
});

export default Cell;
