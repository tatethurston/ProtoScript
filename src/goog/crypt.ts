// https://github.com/google/closure-library/blob/master/closure/goog/crypt/crypt.js#L46
/**
 * Turns an array of numbers into the string given by the concatenation of the
 * characters to which the numbers correspond.
 * @param {!Uint8Array|!Array<number>} bytes Array of numbers representing
 *     characters.
 * @return {string} Stringification of the array.
 */
export function byteArrayToString(bytes: Uint8Array | number[]): string {
  const CHUNK_SIZE = 8192;

  // Special-case the simple case for speed's sake.
  if (bytes.length <= CHUNK_SIZE) {
    return String.fromCharCode.apply(null, bytes);
  }

  // The remaining logic splits conversion by chunks since
  // Function#apply() has a maximum parameter count.
  // See discussion: http://goo.gl/LrWmZ9

  let str = "";
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = Array.prototype.slice.call(bytes, i, i + CHUNK_SIZE);
    str += String.fromCharCode.apply(null, chunk);
  }
  return str;
}

// Replacement for goog.crypt.base64.decodeStringToUint8Array
export function stringToUint8Array(s: string): Uint8Array {
  const buffer = new Uint8Array(s.length);
  buffer.forEach((_, idx) => {
    buffer[idx] = s.charCodeAt(idx);
  });
  return buffer;
}
