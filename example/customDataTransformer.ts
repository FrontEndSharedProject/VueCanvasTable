import { DataTransformer, Column } from "../src";

export class Transformer extends DataTransformer {
  formatValueFromData(
    value: any,
    cellParams: Column["properties"],
    column: Column
  ): any {
    return value + "bbc";
  }

  parseValueToData(
    value: any,
    cellParams: Column["properties"],
    column: Column
  ) {
    return value + "abab";
  }

  parseFromClipboard(value: any, cellParams: Column["properties"]): string {
    return value;
  }
}
