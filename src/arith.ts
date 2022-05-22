/**
 * UInt64 implements some 64-bit arithmetic routines necessary for properly
 * handling 64-bit integer fields. It implements lossless integer arithmetic on
 * top of JavaScript's number type, which has only 53 bits of precision, by
 * representing 64-bit integers as two 32-bit halves.
 *
 * @param {number} lo The low 32 bits.
 * @param {number} hi The high 32 bits.
 * @constructor
 */
export class UInt64 {
  lo: number;
  hi: number;
  constructor(lo: number, hi: number) {
    /**
     * The low 32 bits.
     * @public {number}
     */
    this.lo = lo;
    /**
     * The high 32 bits.
     * @public {number}
     */
    this.hi = hi;
  }

  /**
   * Multiply two 32-bit numbers to produce a 64-bit number.
   * @param {number} a The first integer:  must be in [0, 2^32-1).
   * @param {number} b The second integer: must be in [0, 2^32-1).
   * @return {!jspb.arith.UInt64}
   */
  mul32x32 = function (a: number, b: number): UInt64 {
    // Directly multiplying two 32-bit numbers may produce up to 64 bits of
    // precision, thus losing precision because of the 53-bit mantissa of
    // JavaScript numbers. So we multiply with 16-bit digits (radix 65536)
    // instead.
    const aLow = a & 0xffff;
    const aHigh = a >>> 16;
    const bLow = b & 0xffff;
    const bHigh = b >>> 16;
    let productLow =
      // 32-bit result, result bits 0-31, take all 32 bits
      aLow * bLow +
      // 32-bit result, result bits 16-47, take bottom 16 as our top 16
      ((aLow * bHigh) & 0xffff) * 0x10000 +
      // 32-bit result, result bits 16-47, take bottom 16 as our top 16
      ((aHigh * bLow) & 0xffff) * 0x10000;
    let productHigh =
      // 32-bit result, result bits 32-63, take all 32 bits
      aHigh * bHigh +
      // 32-bit result, result bits 16-47, take top 16 as our bottom 16
      ((aLow * bHigh) >>> 16) +
      // 32-bit result, result bits 16-47, take top 16 as our bottom 16
      ((aHigh * bLow) >>> 16);

    // Carry. Note that we actually have up to *two* carries due to addition of
    // three terms.
    while (productLow >= 0x100000000) {
      productLow -= 0x100000000;
      productHigh += 1;
    }

    return new UInt64(productLow >>> 0, productHigh >>> 0);
  };

  /**
   * Multiply this number by a 32-bit number, producing a 96-bit number, then
   * truncate the top 32 bits.
   * @param {number} a The multiplier.
   * @return {!jspb.arith.UInt64}
   */
  mul = function (a: number): UInt64 {
    // Produce two parts: at bits 0-63, and 32-95.
    const lo = this.mul32x32(this.lo, a);
    const hi = this.mul32x32(this.hi, a);
    // Left-shift hi by 32 bits, truncating its top bits. The parts will then be
    // aligned for addition.
    hi.hi = hi.lo;
    hi.lo = 0;
    return lo.add(hi);
  };

  /**
   * Parse a string into a 64-bit number. Returns `null` on a parse error.
   * @param {string} s
   * @return {?jspb.arith.UInt64}
   */
  static fromString = function (s: string): UInt64 {
    let result = new UInt64(0, 0);
    // optimization: reuse this instance for each digit.
    const digit64 = new UInt64(0, 0);
    for (let i = 0; i < s.length; i++) {
      if (s[i] < "0" || s[i] > "9") {
        return null;
      }
      const digit = parseInt(s[i], 10);
      digit64.lo = digit;
      result = result.mul(10).add(digit64);
    }
    return result;
  };

  /**
   * Add two 64-bit numbers to produce a 64-bit number.
   * @param {!jspb.arith.UInt64} other
   * @return {!jspb.arith.UInt64}
   */
  add = function (other: UInt64): UInt64 {
    const lo = ((this.lo + other.lo) & 0xffffffff) >>> 0;
    const hi =
      (((this.hi + other.hi) & 0xffffffff) >>> 0) +
      (this.lo + other.lo >= 0x100000000 ? 1 : 0);
    return new UInt64(lo >>> 0, hi >>> 0);
  };

  /**
   * Subtract two 64-bit numbers to produce a 64-bit number.
   * @param {!jspb.arith.UInt64} other
   * @return {!jspb.arith.UInt64}
   */
  sub = function (other: UInt64): UInt64 {
    const lo = ((this.lo - other.lo) & 0xffffffff) >>> 0;
    const hi =
      (((this.hi - other.hi) & 0xffffffff) >>> 0) -
      (this.lo - other.lo < 0 ? 1 : 0);
    return new UInt64(lo >>> 0, hi >>> 0);
  };
}

/**
 * Int64 is like UInt64, but modifies string conversions to interpret the stored
 * 64-bit value as a twos-complement-signed integer. It does *not* support the
 * full range of operations that UInt64 does: only add, subtract, and string
 * conversions.
 *
 * N.B. that multiply and divide routines are *NOT* supported. They will throw
 * exceptions. (They are not necessary to implement string conversions, which
 * are the only operations we really need in jspb.)
 *
 * @param {number} lo The low 32 bits.
 * @param {number} hi The high 32 bits.
 * @constructor
 */
export class Int64 {
  lo: number;
  hi: number;
  constructor(lo: number, hi: number) {
    /**
     * The low 32 bits.
     * @public {number}
     */
    this.lo = lo;
    /**
     * The high 32 bits.
     * @public {number}
     */
    this.hi = hi;
  }

  /**
   * Parse a string into a 64-bit number. Returns `null` on a parse error.
   * @param {string} s
   * @return {?jspb.arith.Int64}
   */
  static fromString = function (s: string): Int64 {
    const hasNegative = s.length > 0 && s[0] == "-";
    if (hasNegative) {
      s = s.substring(1);
    }
    let num = UInt64.fromString(s);
    if (num === null) {
      return null;
    }
    if (hasNegative) {
      num = new UInt64(0, 0).sub(num);
    }
    return new Int64(num.lo, num.hi);
  };
}
