export { BinaryReader } from "./runtime/reader.js";
export { BinaryWriter } from "./runtime/writer.js";
export { decodeBase64Bytes, encodeBase64Bytes } from "./runtime/json.js";
export * from "./runtime/well-known-types/index.js";
export type ByteSource = ArrayBuffer | Uint8Array | number[] | string;
export type { UserConfig as Config } from "./cli/core.js";
