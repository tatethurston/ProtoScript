import { byteArrayToString, stringToUint8Array } from "./goog/crypt.js";

export function encodeBase64Bytes(bytes: Uint8Array): string {
  return btoa(byteArrayToString(bytes));
}

export function decodeBase64Bytes(bytes: string): Uint8Array {
  return stringToUint8Array(atob(bytes));
}
