// https://github.com/google/closure-library/blob/master/closure/goog/crypt/crypt.js#L46

// https://developers.google.com/protocol-buffers/docs/encoding#strings
// strings:  valid UTF-8 string (often simply ASCII); max 2GB of bytes
// bytes: any sequence of 8-bit bytes; max 2GB

// Replacement for goog.crypt.base64.byteArrayToString
const decoder = new TextDecoder("utf8");
export function byteArrayToString(bytes: Uint8Array | number[]): string {
  const buffer = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return decoder.decode(buffer);
}

// Replacement for goog.crypt.base64.decodeStringToUint8Array
const encoder = new TextEncoder();
export function stringToUint8Array(s: string): Uint8Array {
  return encoder.encode(s);
}
