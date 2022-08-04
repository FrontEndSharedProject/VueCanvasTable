import type { App } from "vue";
import { createPinia } from "pinia";
import { useGlobalStore } from "./global";

export const store = createPinia();

export function setupStore(app: App<Element>) {
  app.use(store);

  useGlobalStore();
}
