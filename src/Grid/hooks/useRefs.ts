import { useGlobalStore } from "$vct/store/global";
import {onBeforeUnmount, Ref, ref, unref, watchEffect} from "vue";

/**
 * 绑定一些常用的 dom ref 到 globalStore 上
 */

type ReturnType = {
  tableRef: Ref<HTMLDivElement | undefined>;
  stageRef: Ref<any>;
  stageContainerRef: Ref<HTMLDivElement | undefined>;
  horizontalScrollRef: Ref<HTMLDivElement | undefined>;
  verticalScrollRef: Ref<HTMLDivElement | undefined>;
};

let cache: ReturnType | null = null;

export function useRefs(): ReturnType {
  if (cache) return cache;

  const globalStore = useGlobalStore();

  const tableRef = ref<HTMLDivElement>();
  const stageRef = ref<any>();
  const stageContainerRef = ref<HTMLDivElement>();
  const horizontalScrollRef = ref<HTMLDivElement>();
  const verticalScrollRef = ref<HTMLDivElement>();

  //  保存 refs 到 store 中
  watchEffect(() => {
    globalStore.refs.stageRef = unref(stageRef);
    globalStore.refs.tableRef = unref(tableRef);
    globalStore.refs.stageContainerRef = unref(stageContainerRef);
    globalStore.refs.horizontalScrollRef = unref(horizontalScrollRef);
    globalStore.refs.verticalScrollRef = unref(verticalScrollRef);
  });

  onBeforeUnmount(() => {
    cache = null;
  });

  cache = {
    tableRef,
    stageRef,
    stageContainerRef,
    horizontalScrollRef,
    verticalScrollRef,
  };

  return cache;
}
