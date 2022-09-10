import { getCurrentInstance } from "vue";
import { ComponentInternalInstance } from "@vue/runtime-core";
import { setupStore } from "$vct/store/store";
// import VueKonva from "vue-konva";

export function init() {
  const app = getCurrentInstance() as ComponentInternalInstance;
  //  避免 HMR 导致的重复注册问题
  if (app.appContext.app.config.globalProperties.$pinia) {
    return;
  }

  // app.appContext.app.use(VueKonva);
  setupStore(app.appContext.app);
}
