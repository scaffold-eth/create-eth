// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
export const bigintReviver = (key: string, value: unknown) =>
  value !== null && typeof value === "object" && "$bigint" in value && typeof value.$bigint === "string"
    ? BigInt(value.$bigint)
    : value;
