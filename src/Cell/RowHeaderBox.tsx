import { defineComponent, computed, PropType, ref } from "vue";
import { RowHeaderProps } from "@/types";
import { useStore } from "@/hooks/useStore";
import { checkboxCheck, checkboxUnCheck } from "@/icons/icons";
import { useDimensions } from "@/hooks/useDimensions";

const RowHeaderBox = defineComponent({
  name: "RowHeaderBox",
  inheritAttrs: false,
  props: {
    data: {
      type: Object as PropType<RowHeaderProps>,
      required: true,
    },
  },
  setup(props, { attrs }) {
    const { themes, selectedRows } = useStore();
    const { rowHeaderWidth } = useDimensions();

    const isHover = ref<boolean>(false);
    const isSelected = computed(() =>
      selectedRows.value.includes(props.data.index)
    );
    const _y = props.data.index === 0 ? props.data.y - 0.5 : props.data.y + 0.5;
    const _height =
      props.data.index === 0 ? props.data.height + 1 : props.data.height;

    const checkboxCheckPathConfig = computed(() => {
      return {
        x: (rowHeaderWidth.value - 16) / 2,
        y: (props.data.height - 16) / 2,
        data: isSelected.value ? checkboxCheck : checkboxUnCheck,
        // stroke: isSelected.value ? "#fff" : themes.value.textColor2,
        // stroke: '#f20',
        // fill: themes.value.main,
        fill: isSelected.value ? themes.value.main : themes.value.textColor2,
        scaleX: 0.7,
        scaleY: 0.7,
        strokeWidth: 0,
      };
    });

    function handleMouseenter() {
      isHover.value = true;
    }

    function handleMouseout() {
      isHover.value = false;
    }

    function handleIconClick() {}

    return () => (
      <v-group
        config={{
          x: props.data.x,
          y: props.data.y,
        }}
      >
        <v-rect
          config={{
            x: 0.5,
            y: _y,
            width: props.data.width,
            height: _height,
            fill: "#f7f8fc",
            stroke: themes.value.lineColor,
            strokeWidth: 1,
            shadowForStrokeEnabled: false,
            strokeScaleEnabled: false,
            hitStrokeWidth: 0,
          }}
          shadowForStrokeEnabled={false}
          hitStrokeWidth={0}
          onMouseenter={handleMouseenter}
          onMouseout={handleMouseout}
          onClick={handleIconClick}
        />

        {isSelected.value || isHover.value ? (
          <v-path
            config={checkboxCheckPathConfig.value}
            listening={false}
            shadowForStrokeEnabled={false}
            hitStrokeWidth={0}
          />
        ) : (
          <v-text
            config={{
              width: props.data.width,
              height: props.data.height,
              text: props.data.index + 1,
              fill: "#676d82",
              verticalAlign: "middle",
              align: "center",
            }}
            listening={false}
            shadowForStrokeEnabled={false}
            hitStrokeWidth={0}
          />
        )}
      </v-group>
    );
  },
});

export { RowHeaderBox };
