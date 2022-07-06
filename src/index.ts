export { BinaryReader } from "./runtime/reader.js";
export { BinaryWriter } from "./runtime/writer.js";
export { decodeBase64Bytes, encodeBase64Bytes } from "./runtime/json.js";
export type ByteSource = ArrayBuffer | Uint8Array | number[] | string;
