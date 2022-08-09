import { defineComponent, computed, PropType } from "vue";
import { RowHeaderProps } from "@/types";

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
            y: 0.5,
            width: props.data.width,
            height: props.data.height,
            fill: "#f7f8fc",
            stroke: "#d9d9d9",
            strokeWidth: 1,
            shadowForStrokeEnabled: false,
            strokeScaleEnabled: false,
            hitStrokeWidth: 0,
          }}
        ></v-rect>
        <v-text
          config={{
            width: props.data.width,
            height: props.data.height,
            text: props.data.index,
            fill: "#676d82",
            verticalAlign: "middle",
            align: "center",
          }}
        />
      </v-group>
    );
  },
});

export { RowHeaderBox };
