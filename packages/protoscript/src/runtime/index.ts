export { BinaryReader } from "./reader.js";
export { BinaryWriter } from "./writer.js";
export { decodeBase64Bytes, encodeBase64Bytes } from "./json.js";
export type ByteSource = ArrayBuffer | Uint8Array | number[] | string;
export type PartialDeep<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in keyof T]?: T[P] extends any[] | Record<any, any> | Uint8Array
    ? T[P]
    : T[P] extends object | null | undefined
    ? PartialDeep<T[P]>
    : T[P];
};
