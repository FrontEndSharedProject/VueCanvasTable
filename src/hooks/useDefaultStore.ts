import { useGlobalStore } from "@/store/global";
import { getCurrentInstance, watchEffect } from "vue";

export function useDefaultStore() {
  const instance = getCurrentInstance() as any;
  if (!instance) throw new Error("无法找到 grid 实例");
  const globalStore = useGlobalStore();

  const props = instance.props;

  //  设置默认值
  watchEffect(() => {
    Object.keys(instance.props).map((key) => {
      let storeKey = key;
      //  rows 数据需要设置为私密的，通过 getter 获取
      if (key === "rows") {
        storeKey = "_rows";
      }
      if (key === "columns") {
        storeKey = "_columns";
      }

      globalStore[storeKey] = props[key];
    });
  });
}
