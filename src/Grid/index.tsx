import { defineComponent, createApp, ref, unref, onMounted } from "vue";
import Grid from "./Grid.vue";
import VueKonva from "vue-konva";
import { setupStore } from "@/store/store";

export default defineComponent({
  name: "VueCanvasTable",
  inheritAttrs: false,
  setup(props, { attrs }) {
    const wrapRef = ref();
    const app = createApp(
      {
        components: {
          Grid: Grid,
        },
        setup(props, { attrs }) {
          return () => <Grid {...attrs} />;
        },
      },
      attrs
    );

    app.use(VueKonva);
    setupStore(app);

    onMounted(() => {
      app.mount(unref(wrapRef));
    });

    return () => <div ref={wrapRef} class="vue-canvas-table-wrap" />;
  },
});
