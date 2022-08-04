import { computed, defineComponent, unref } from "vue";
import { isNumber } from "lodash-es";
import { Icon } from "@iconify/vue";
import "./style.less";

export default defineComponent({
  name: "AIcon",
  components: {
    Icon,
  },
  props: {
    type: {
      type: String,
      required: false,
    },
    size: {
      type: [String, Number],
      default: 14,
    },
    color: {
      type: String,
      default: "inherit",
    },
    spin: Boolean,
    button: Boolean,
    filled: Boolean,
  },
  setup(props, { attrs }) {
    if (!props.type)
      return () => <div class="app-iconify undefined-icon">U</div>;

    const iconSize = computed(() => {
      return isNumber(props.size) ? `${props.size}px` : props.size;
    });
    const iconType = computed(() => {
      //  @ts-ignore
      return !!~props.type.indexOf(":")
        ? props.type
        : `ant-design:${props.type}${props.filled ? "-filled" : ""}`;
    });

    const Tag = props.button ? "button" : "span";
    //  @ts-ignore
    const iconClass = `app-iconify-${unref(iconType).replaceAll(":", "_")}`;

    return () => (
      <Tag class={`app-iconify ${iconClass}`} {...attrs}>
        <Icon
          //  @ts-ignore
          icon={unref(iconType)}
          color={props.color}
          width={unref(iconSize)}
          height={unref(iconSize)}
        />
      </Tag>
    );
  },
});
