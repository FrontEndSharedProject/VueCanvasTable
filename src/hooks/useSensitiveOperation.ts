/**
 * 该文件用于处理敏感操作时候的提示
 */
import { useGlobalStore } from "$vct/store/global";

type ReturnType = {
  showConfirm(length: number): Promise<boolean>;
};

export function useSensitiveOperation(): ReturnType {
  const globalStore = useGlobalStore();

  function showConfirm(length: number): Promise<boolean> {
    if (length <= globalStore.maxOperationNums) return Promise.resolve(true);

    return new Promise<boolean>(async (res) => {
      const returnRes = await globalStore.onConfirm({
        title: "警告",
        content: `此次操作将会影响到 ${length} 个单元格，您确定吗？`,
      });
      res(returnRes);
    });
  }

  return {
    showConfirm,
  };
}
