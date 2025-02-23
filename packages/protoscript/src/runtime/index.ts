export { BinaryReader } from "./reader.js";
export { BinaryWriter } from "./writer.js";
export * from "./json.js";
export type ByteSource = ArrayBuffer | Uint8Array | number[] | string;
export type PartialDeep<T> = {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [P in keyof T]?: NonNullable<T[P]> extends any[] | Uint8Array
    ? T[P]
    : NonNullable<T[P]> extends object
      ? PartialDeep<T[P]>
      : T[P];
  /* eslint-enable @typescript-eslint/no-explicit-any */
};
