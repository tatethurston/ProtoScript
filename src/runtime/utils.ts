import { assert } from "./goog/asserts.js";
import { byteArrayToString, stringToUint8Array } from "./goog/crypt.js";
import {
  FLOAT32_MAX,
  FLOAT32_MIN,
  FLOAT64_MAX,
  FLOAT64_MIN,
  TWO_TO_20,
  TWO_TO_23,
  TWO_TO_32,
  TWO_TO_52,
} from "./constants.js";

export type ByteSource = ArrayBuffer | Uint8Array | number[] | string;

/**
 * Converts any type defined in jspb.ByteSource into a Uint8Array.
 * @param {!jspb.ByteSource} data
 * @return {!Uint8Array}
 * @suppress {invalidCasts}
 */
export function byteSourceToUint8Array(data: ByteSource): Uint8Array {
  if (data instanceof Uint8Array) {
    return data;
  }

  if (typeof data === "string") {
    return stringToUint8Array(data);
  }

  return new Uint8Array(data);
}

/**
 * Converts split 64-bit values from zigzag encoding to standard two's
 * complement encoding. Invokes the provided function to produce final result.
 *
 * @param {number} bitsLow
 * @param {number} bitsHigh
 * @param {function(number, number): T} convert Conversion function to produce
 *     the result value, takes parameters (lowBits, highBits).
 * @return {T}
 * @template T
 */
export function fromZigzag64<T>(
  bitsLow: number,
  bitsHigh: number,
  // eslint-disable-next-line no-unused-vars
  convert: (a: number, b: number) => T
): T {
  // 64 bit math is:
  //   signmask = (zigzag & 1) ? -1 : 0;
  //   twosComplement = (zigzag >> 1) ^ signmask;
  //
  // To work with 32 bit, we can operate on both but "carry" the lowest bit
  // from the high word by shifting it up 31 bits to be the most significant bit
  // of the low word.
  const signFlipMask = -(bitsLow & 1);
  bitsLow = ((bitsLow >>> 1) | (bitsHigh << 31)) ^ signFlipMask;
  bitsHigh = (bitsHigh >>> 1) ^ signFlipMask;
  return convert(bitsLow, bitsHigh);
}

/**
 * Converts split 64-bit values from standard two's complement encoding to
 * zig-zag encoding. Invokes the provided function to produce final result.
 *
 * @param {number} bitsLow
 * @param {number} bitsHigh
 * @param {function(number, number): T} convert Conversion function to produce
 *     the result value, takes parameters (lowBits, highBits).
 * @return {T}
 * @template T
 */
export function toZigzag64<T>(
  bitsLow: number,
  bitsHigh: number,
  // eslint-disable-next-line no-unused-vars
  convert: (a: number, b: number) => T
): T {
  // See
  // https://engdoc.corp.google.com/eng/howto/protocolbuffers/developerguide/encoding.shtml?cl=head#types
  // 64-bit math is: (n << 1) ^ (n >> 63)
  //
  // To do this in 32 bits, we can get a 32-bit sign-flipping mask from the
  // high word.
  // Then we can operate on each word individually, with the addition of the
  // "carry" to get the most significant bit from the low word into the high
  // word.
  const signFlipMask = bitsHigh >> 31;
  bitsHigh = ((bitsHigh << 1) | (bitsLow >>> 31)) ^ signFlipMask;
  bitsLow = (bitsLow << 1) ^ signFlipMask;
  return convert(bitsLow, bitsHigh);
}

/** @const @private {number} '0' */
const ZERO_CHAR_CODE_ = 48;

/**
 * Converts a signed or unsigned decimal string into its hash string
 * representation.
 * @param {string} dec
 * @return {string}
 */
export function decimalStringToHash64(dec: string): string {
  assert(dec.length > 0);

  // Check for minus sign.
  let minus = false;
  if (dec[0] === "-") {
    minus = true;
    dec = dec.slice(1);
  }

  // Store result as a byte array.
  const resultBytes = [0, 0, 0, 0, 0, 0, 0, 0];

  // Set result to m*result + c.
  function muladd(m: number, c: number) {
    for (let i = 0; i < 8 && (m !== 1 || c > 0); i++) {
      const r = m * resultBytes[i] + c;
      resultBytes[i] = r & 0xff;
      c = r >>> 8;
    }
  }

  // Negate the result bits.
  function neg() {
    for (let i = 0; i < 8; i++) {
      resultBytes[i] = ~resultBytes[i] & 0xff;
    }
  }

  // For each decimal digit, set result to 10*result + digit.
  for (let i = 0; i < dec.length; i++) {
    muladd(10, dec.charCodeAt(i) - ZERO_CHAR_CODE_);
  }

  // If there's a minus sign, convert into two's complement.
  if (minus) {
    neg();
    muladd(1, 1);
  }

  return byteArrayToString(resultBytes);
}

/**
 * Javascript can't natively handle 64-bit data types, so to manipulate them we
 * have to split them into two 32-bit halves and do the math manually.
 *
 * Instead of instantiating and passing small structures around to do this, we
 * instead just use two global temporary values. This one stores the low 32
 * bits of a split value - for example, if the original value was a 64-bit
 * integer, this temporary value will contain the low 32 bits of that integer.
 * If the original value was a double, this temporary value will contain the
 * low 32 bits of the binary representation of that double, etcetera.
 */
export let split64Low = 0;

/**
 * And correspondingly, this temporary variable will contain the high 32 bits
 * of whatever value was split.
 */
export let split64High = 0;

/**
 * Splits a signed Javascript integer into two 32-bit halves and stores it in
 * the temp values above.
 * @param {number} value The number to split.
 */
export const splitInt64 = function (value: number): void {
  // Convert to sign-magnitude representation.
  const sign = value < 0;
  value = Math.abs(value);

  // Extract low 32 bits and high 32 bits as unsigned integers.
  let lowBits = value >>> 0;
  let highBits = Math.floor((value - lowBits) / TWO_TO_32);
  highBits = highBits >>> 0;

  // Perform two's complement conversion if the sign bit was set.
  if (sign) {
    highBits = ~highBits >>> 0;
    lowBits = ~lowBits >>> 0;
    lowBits += 1;
    if (lowBits > 0xffffffff) {
      lowBits = 0;
      highBits++;
      if (highBits > 0xffffffff) highBits = 0;
    }
  }

  split64Low = lowBits;
  split64High = highBits;
};

/**
 * Splits an unsigned Javascript integer into two 32-bit halves and stores it
 * in the temp values above.
 * @param {number} value The number to split.
 */
export const splitUint64 = function (value: number): void {
  // Extract low 32 bits and high 32 bits as unsigned integers.
  const lowBits = value >>> 0;
  const highBits = Math.floor((value - lowBits) / TWO_TO_32) >>> 0;

  split64Low = lowBits;
  split64High = highBits;
};

/**
 * Converts a signed Javascript integer into zigzag format, splits it into two
 * 32-bit halves, and stores it in the temp values above.
 * @param {number} value The number to split.
 */
export const splitZigzag64 = function (value: number): void {
  // Convert to sign-magnitude and scale by 2 before we split the value.
  const sign = value < 0;
  value = Math.abs(value) * 2;

  splitUint64(value);
  let lowBits = split64Low;
  let highBits = split64High;

  // If the value is negative, subtract 1 from the split representation so we
  // don't lose the sign bit due to precision issues.
  if (sign) {
    if (lowBits == 0) {
      if (highBits == 0) {
        lowBits = 0xffffffff;
        highBits = 0xffffffff;
      } else {
        highBits--;
        lowBits = 0xffffffff;
      }
    } else {
      lowBits--;
    }
  }

  split64Low = lowBits;
  split64High = highBits;
};

/**
 * Converts an 8-character hash string into two 32-bit numbers and stores them
 * in the temp values above.
 * @param {string} hash
 */
export const splitHash64 = function (hash: string): void {
  const a = hash.charCodeAt(0);
  const b = hash.charCodeAt(1);
  const c = hash.charCodeAt(2);
  const d = hash.charCodeAt(3);
  const e = hash.charCodeAt(4);
  const f = hash.charCodeAt(5);
  const g = hash.charCodeAt(6);
  const h = hash.charCodeAt(7);

  split64Low = (a + (b << 8) + (c << 16) + (d << 24)) >>> 0;
  split64High = (e + (f << 8) + (g << 16) + (h << 24)) >>> 0;
};

/**
 * Converts a floating-point number into 32-bit IEEE representation and stores
 * it in the temp values above.
 * @param {number} value
 */
export const splitFloat32 = function (value: number): void {
  const sign = value < 0 ? 1 : 0;
  value = sign ? -value : value;
  let exp;
  let mant;

  // Handle zeros.
  if (value === 0) {
    if (1 / value > 0) {
      // Positive zero.
      split64High = 0;
      split64Low = 0x00000000;
    } else {
      // Negative zero.
      split64High = 0;
      split64Low = 0x80000000;
    }
    return;
  }

  // Handle nans.
  if (isNaN(value)) {
    split64High = 0;
    split64Low = 0x7fffffff;
    return;
  }

  // Handle infinities.
  if (value > FLOAT32_MAX) {
    split64High = 0;
    split64Low = ((sign << 31) | 0x7f800000) >>> 0;
    return;
  }

  // Handle denormals.
  if (value < FLOAT32_MIN) {
    // Number is a denormal.
    mant = Math.round(value / Math.pow(2, -149));
    split64High = 0;
    split64Low = ((sign << 31) | mant) >>> 0;
    return;
  }

  exp = Math.floor(Math.log(value) / Math.LN2);
  mant = value * Math.pow(2, -exp);
  mant = Math.round(mant * TWO_TO_23);
  if (mant >= 0x1000000) {
    ++exp;
  }
  mant = mant & 0x7fffff;

  split64High = 0;
  split64Low = ((sign << 31) | ((exp + 127) << 23) | mant) >>> 0;
};

/**
 * Converts a floating-point number into 64-bit IEEE representation and stores
 * it in the temp values above.
 * @param {number} value
 */
export const splitFloat64 = function (value: number): void {
  const sign = value < 0 ? 1 : 0;
  value = sign ? -value : value;

  // Handle zeros.
  if (value === 0) {
    if (1 / value > 0) {
      // Positive zero.
      split64High = 0x00000000;
      split64Low = 0x00000000;
    } else {
      // Negative zero.
      split64High = 0x80000000;
      split64Low = 0x00000000;
    }
    return;
  }

  // Handle nans.
  if (isNaN(value)) {
    split64High = 0x7fffffff;
    split64Low = 0xffffffff;
    return;
  }

  // Handle infinities.
  if (value > FLOAT64_MAX) {
    split64High = ((sign << 31) | 0x7ff00000) >>> 0;
    split64Low = 0;
    return;
  }

  // Handle denormals.
  if (value < FLOAT64_MIN) {
    // Number is a denormal.
    const mant = value / Math.pow(2, -1074);
    const mantHigh = mant / TWO_TO_32;
    split64High = ((sign << 31) | mantHigh) >>> 0;
    split64Low = mant >>> 0;
    return;
  }

  // Compute the least significant exponent needed to represent the magnitude of
  // the value by repeadly dividing/multiplying by 2 until the magnitude
  // crosses 2. While tempting to use log math to find the exponent, at the
  // boundaries of precision, the result can be off by one.
  const maxDoubleExponent = 1023;
  const minDoubleExponent = -1022;
  let x = value;
  let exp = 0;
  if (x >= 2) {
    while (x >= 2 && exp < maxDoubleExponent) {
      exp++;
      x = x / 2;
    }
  } else {
    while (x < 1 && exp > minDoubleExponent) {
      x = x * 2;
      exp--;
    }
  }
  const mant = value * Math.pow(2, -exp);

  const mantHigh = (mant * TWO_TO_20) & 0xfffff;
  const mantLow = (mant * TWO_TO_52) >>> 0;

  split64High = ((sign << 31) | ((exp + 1023) << 20) | mantHigh) >>> 0;
  split64Low = mantLow;
};

/**
 * Joins two 32-bit values into a 64-bit unsigned integer. Precision will be
 * lost if the result is greater than 2^52.
 * @param {number} bitsLow
 * @param {number} bitsHigh
 * @return {number}
 */
export const joinUint64 = function (bitsLow: number, bitsHigh: number): number {
  return bitsHigh * TWO_TO_32 + (bitsLow >>> 0);
};

/**
 * Joins two 32-bit values into a 64-bit signed integer. Precision will be lost
 * if the result is greater than 2^52.
 * @param {number} bitsLow
 * @param {number} bitsHigh
 * @return {number}
 */
export const joinInt64 = function (bitsLow: number, bitsHigh: number): number {
  // If the high bit is set, do a manual two's complement conversion.
  const sign = bitsHigh & 0x80000000;
  if (sign) {
    bitsLow = (~bitsLow + 1) >>> 0;
    bitsHigh = ~bitsHigh >>> 0;
    if (bitsLow == 0) {
      bitsHigh = (bitsHigh + 1) >>> 0;
    }
  }

  const result = joinUint64(bitsLow, bitsHigh);
  return sign ? -result : result;
};

/**
 * Joins two 32-bit values into a 64-bit unsigned integer and applies zigzag
 * decoding. Precision will be lost if the result is greater than 2^52.
 * @param {number} bitsLow
 * @param {number} bitsHigh
 * @return {number}
 */
export const joinZigzag64 = function (
  bitsLow: number,
  bitsHigh: number
): number {
  return fromZigzag64(bitsLow, bitsHigh, joinInt64);
};

/**
 * Joins two 32-bit values into an 8-character hash string.
 * @param {number} bitsLow
 * @param {number} bitsHigh
 * @return {string}
 */
export const joinHash64 = function (bitsLow: number, bitsHigh: number): string {
  const a = (bitsLow >>> 0) & 0xff;
  const b = (bitsLow >>> 8) & 0xff;
  const c = (bitsLow >>> 16) & 0xff;
  const d = (bitsLow >>> 24) & 0xff;
  const e = (bitsHigh >>> 0) & 0xff;
  const f = (bitsHigh >>> 8) & 0xff;
  const g = (bitsHigh >>> 16) & 0xff;
  const h = (bitsHigh >>> 24) & 0xff;

  return String.fromCharCode(a, b, c, d, e, f, g, h);
};

/**
 * Joins two 32-bit values into a 32-bit IEEE floating point number and
 * converts it back into a Javascript number.
 * @param {number} bitsLow The low 32 bits of the binary number;
 * @return {number}
 */
export function joinFloat32(bitsLow: number): number {
  const sign = (bitsLow >> 31) * 2 + 1;
  const exp = (bitsLow >>> 23) & 0xff;
  const mant = bitsLow & 0x7fffff;

  if (exp == 0xff) {
    if (mant) {
      return NaN;
    } else {
      return sign * Infinity;
    }
  }

  if (exp == 0) {
    // Denormal.
    return sign * Math.pow(2, -149) * mant;
  } else {
    return sign * Math.pow(2, exp - 150) * (mant + Math.pow(2, 23));
  }
}

/**
 * Joins two 32-bit values into a 64-bit IEEE floating point number and
 * converts it back into a Javascript number.
 * @param {number} bitsLow The low 32 bits of the binary number;
 * @param {number} bitsHigh The high 32 bits of the binary number.
 * @return {number}
 */
export const joinFloat64 = function (
  bitsLow: number,
  bitsHigh: number
): number {
  const sign = (bitsHigh >> 31) * 2 + 1;
  const exp = (bitsHigh >>> 20) & 0x7ff;
  const mant = TWO_TO_32 * (bitsHigh & 0xfffff) + bitsLow;

  if (exp == 0x7ff) {
    if (mant) {
      return NaN;
    } else {
      return sign * Infinity;
    }
  }

  if (exp == 0) {
    // Denormal.
    return sign * Math.pow(2, -1074) * mant;
  } else {
    return sign * Math.pow(2, exp - 1075) * (mant + TWO_TO_52);
  }
};

/**
 * Losslessly converts a 64-bit unsigned integer in 32:32 split representation
 * into a decimal string.
 * @param {number} bitsLow The low 32 bits of the binary number;
 * @param {number} bitsHigh The high 32 bits of the binary number.
 * @return {string} The binary number represented as a string.
 */
export const joinUnsignedDecimalString = function (
  bitsLow: number,
  bitsHigh: number
): string {
  // Skip the expensive conversion if the number is small enough to use the
  // built-in conversions.
  if (bitsHigh <= 0x1fffff) {
    return joinUint64(bitsLow, bitsHigh).toString();
  }

  // What this code is doing is essentially converting the input number from
  // base-2 to base-1e7, which allows us to represent the 64-bit range with
  // only 3 (very large) digits. Those digits are then trivial to convert to
  // a base-10 string.

  // The magic numbers used here are -
  // 2^24 = 16777216 = (1,6777216) in base-1e7.
  // 2^48 = 281474976710656 = (2,8147497,6710656) in base-1e7.

  // Split 32:32 representation into 16:24:24 representation so our
  // intermediate digits don't overflow.
  const low = bitsLow & 0xffffff;
  const mid = (((bitsLow >>> 24) | (bitsHigh << 8)) >>> 0) & 0xffffff;
  const high = (bitsHigh >> 16) & 0xffff;

  // Assemble our three base-1e7 digits, ignoring carries. The maximum
  // value in a digit at this step is representable as a 48-bit integer, which
  // can be stored in a 64-bit floating point number.
  let digitA = low + mid * 6777216 + high * 6710656;
  let digitB = mid + high * 8147497;
  let digitC = high * 2;

  // Apply carries from A to B and from B to C.
  const base = 10000000;
  if (digitA >= base) {
    digitB += Math.floor(digitA / base);
    digitA %= base;
  }

  if (digitB >= base) {
    digitC += Math.floor(digitB / base);
    digitB %= base;
  }

  // Convert base-1e7 digits to base-10, with optional leading zeroes.
  function decimalFrom1e7(digit1e7: number, needLeadingZeros: number) {
    const partial = digit1e7 ? String(digit1e7) : "";
    if (needLeadingZeros) {
      return "0000000".slice(partial.length) + partial;
    }
    return partial;
  }

  return (
    decimalFrom1e7(digitC, 0) +
    decimalFrom1e7(digitB, digitC) +
    // If the final 1e7 digit didn't need leading zeros, we would have
    // returned via the trivial code path at the top.
    decimalFrom1e7(digitA, 1)
  );
};

/**
 * Losslessly converts a 64-bit signed integer in 32:32 split representation
 * into a decimal string.
 * @param {number} bitsLow The low 32 bits of the binary number;
 * @param {number} bitsHigh The high 32 bits of the binary number.
 * @return {string} The binary number represented as a string.
 */
export const joinSignedDecimalString = function (
  bitsLow: number,
  bitsHigh: number
): string {
  // If we're treating the input as a signed value and the high bit is set, do
  // a manual two's complement conversion before the decimal conversion.
  const negative = bitsHigh & 0x80000000;
  if (negative) {
    bitsLow = (~bitsLow + 1) >>> 0;
    const carry = bitsLow == 0 ? 1 : 0;
    bitsHigh = (~bitsHigh + carry) >>> 0;
  }

  const result = joinUnsignedDecimalString(bitsLow, bitsHigh);
  return negative ? "-" + result : result;
};
