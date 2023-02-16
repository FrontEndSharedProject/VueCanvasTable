import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  ShallowRef,
  shallowRef,
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
import { cloneDeep } from "lodash-es";

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
    const { themes, rows, stageRef } = useStore();

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
      textColor = "#000",
      padding = 5,
      fontFamily = "arial, sans, sans-serif",
      fontSize = 13,
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

    const backgroundRect = shallowRef<ShapeConfig>({
      x: x,
      y: _y,
      height: _h,
      width: width + 0.5,
      // fill: readonly ? "#F6F6F8" : fill,
      fill,
      stroke: stroke,
      strokeWidth: strokeWidth,
      shadowForStrokeEnabled: false,
      strokeScaleEnabled: false,
      hitStrokeWidth: 0,
      fillEnabled: fillEnabled,
      strokeEnabled: strokeEnabled,
      alpha,
    });
    const defaultText = shallowRef<ShapeConfig>({
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
    });

    //  提供 hook 已达到外部修改默认样式
    if (globalStore.onCellBeforeRender) {
      const newShape = globalStore.onCellBeforeRender(
        {
          backgroundRect: cloneDeep(unref(backgroundRect)),
          defaultText: cloneDeep(unref(defaultText)),
        },
        value.value,
        props.renderProps
      );

      backgroundRect.value = newShape.backgroundRect;
      defaultText.value = newShape.defaultText;
    }

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

    watch(value, () => {
      //  提供 hook 已达到外部修改默认样式
      if (globalStore.onCellBeforeRender) {
        const newShape = globalStore.onCellBeforeRender(
          {
            backgroundRect: cloneDeep(unref(backgroundRect)),
            defaultText: cloneDeep(unref(defaultText)),
          },
          value.value,
          props.renderProps
        );

        backgroundRect.value = newShape.backgroundRect;
        defaultText.value = newShape.defaultText;
      }
    });

    function handleMouseenter() {
      if (readonly) {
        stageRef.value.getStage().container().style.cursor = "not-allowed";
      }
    }

    function handleMouseleave() {
      stageRef.value.getStage().container().style.cursor = "default";
    }

    return () => (
      <v-group {...rest} key={x} ref={groupRef}>
        <v-rect
          config={backgroundRect.value}
          listening={true}
          shadowForStrokeEnabled={false}
          hitStrokeWidth={0}
          onMouseenter={handleMouseenter}
          onMouseleave={handleMouseleave}
        />

        {isNull(unref(value)) ? null : (
          <>
            {render ? (
              <render
                value={value}
                renderProps={props.renderProps}
                defaultTextConfig={defaultText.value}
              />
            ) : (
              <v-text
                text={value.value}
                listening={false}
                config={defaultText.value}
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
