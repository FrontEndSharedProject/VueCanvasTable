import { DataVerification } from "$vct/types";

type ReturnType = {
  verify(value: string, rules: DataVerification): string[] | false;
};

export function useDataVerification(): ReturnType {
  function verify(value: string, rules: DataVerification): string[] | false {
    let unPassMsg: string[] = [];
    rules.map(({ pattern, errorMessage }) => {
      let isPassed = dataValidate(pattern, value);
      if (!isPassed) {
        unPassMsg.push(errorMessage);
      }
    });

    if (unPassMsg.length > 0) {
      return unPassMsg;
    } else {
      return false;
    }
  }

  function dataValidate(pattern: string, value) {
    /*
      let str = item.replace(/^\/(.*)\/([a-z]*)$/, '$1')
      let args = item.replace(/^\/(.*)\/([a-z]*)$/, '$2')
      return new RegExp(str, args)
    * */
    try {
      const regexpObj = new RegExp(pattern.trim());

      return regexpObj.test(value);
    } catch (e) {
      console.log("数据验证,正则执行错误", { pattern, value });
      return false;
    }
  }

  return {
    verify,
  };
}
