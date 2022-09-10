import "normalize.css";
import { createApp } from "vue";
import VueKonva from "@carljin/vue-konva";

import App from "./App.vue";

const app = createApp(App);
app.use(VueKonva)
app.mount("#app");
