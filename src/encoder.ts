import { assert } from "./goog/asserts";
import {
  decimalStringToHash64,
  split64High,
  split64Low,
  splitFloat32,
  splitFloat64,
  splitHash64,
  splitInt64,
  splitUint64,
  splitZigzag64,
  toZigzag64,
} from "./utils";
import {
  TWO_TO_31,
  TWO_TO_63,
  TWO_TO_32,
  TWO_TO_64,
  FLOAT32_MAX,
  FLOAT64_MAX,
} from "./constants";

/**
 * BinaryEncoder implements encoders for all the wire types specified in
 * https://developers.google.com/protocol-buffers/docs/encoding.
 *
 * @constructor
 * @struct
 */
export const BinaryEncoder = function () {
  /** @private {!Array<number>} */
  this.buffer_ = [];
};

/**
 * @return {number}
 */
BinaryEncoder.prototype.length = function () {
  return this.buffer_.length;
};

/**
 * @return {!Array<number>}
 */
BinaryEncoder.prototype.end = function () {
  const buffer = this.buffer_;
  this.buffer_ = [];
  return buffer;
};

/**
 * Encodes a 64-bit integer in 32:32 split representation into its wire-format
 * varint representation and stores it in the buffer.
 * @param {number} lowBits The low 32 bits of the int.
 * @param {number} highBits The high 32 bits of the int.
 */
BinaryEncoder.prototype.writeSplitVarint64 = function (lowBits, highBits) {
  assert(lowBits == Math.floor(lowBits));
  assert(highBits == Math.floor(highBits));
  assert(lowBits >= 0 && lowBits < TWO_TO_32);
  assert(highBits >= 0 && highBits < TWO_TO_32);

  // Break the binary representation into chunks of 7 bits, set the 8th bit
  // in each chunk if it's not the final chunk, and append to the result.
  while (highBits > 0 || lowBits > 127) {
    this.buffer_.push((lowBits & 0x7f) | 0x80);
    lowBits = ((lowBits >>> 7) | (highBits << 25)) >>> 0;
    highBits = highBits >>> 7;
  }
  this.buffer_.push(lowBits);
};

/**
 * Encodes a 64-bit integer in 32:32 split representation into its wire-format
 * fixed representation and stores it in the buffer.
 * @param {number} lowBits The low 32 bits of the int.
 * @param {number} highBits The high 32 bits of the int.
 */
BinaryEncoder.prototype.writeSplitFixed64 = function (lowBits, highBits) {
  assert(lowBits == Math.floor(lowBits));
  assert(highBits == Math.floor(highBits));
  assert(lowBits >= 0 && lowBits < TWO_TO_32);
  assert(highBits >= 0 && highBits < TWO_TO_32);
  this.writeUint32(lowBits);
  this.writeUint32(highBits);
};

/**
 * Encodes a 32-bit unsigned integer into its wire-format varint representation
 * and stores it in the buffer.
 * @param {number} value The integer to convert.
 */
BinaryEncoder.prototype.writeUnsignedVarint32 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= 0 && value < TWO_TO_32);

  while (value > 127) {
    this.buffer_.push((value & 0x7f) | 0x80);
    value = value >>> 7;
  }

  this.buffer_.push(value);
};

/**
 * Encodes a 32-bit signed integer into its wire-format varint representation
 * and stores it in the buffer.
 * @param {number} value The integer to convert.
 */
BinaryEncoder.prototype.writeSignedVarint32 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= -TWO_TO_31 && value < TWO_TO_31);

  // Use the unsigned version if the value is not negative.
  if (value >= 0) {
    this.writeUnsignedVarint32(value);
    return;
  }

  // Write nine bytes with a _signed_ right shift so we preserve the sign bit.
  for (let i = 0; i < 9; i++) {
    this.buffer_.push((value & 0x7f) | 0x80);
    value = value >> 7;
  }

  // The above loop writes out 63 bits, so the last byte is always the sign bit
  // which is always set for negative numbers.
  this.buffer_.push(1);
};

/**
 * Encodes a 64-bit unsigned integer into its wire-format varint representation
 * and stores it in the buffer. Integers that are not representable in 64 bits
 * will be truncated.
 * @param {number} value The integer to convert.
 */
BinaryEncoder.prototype.writeUnsignedVarint64 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= 0 && value < TWO_TO_64);
  splitInt64(value);
  this.writeSplitVarint64(split64Low, split64High);
};

/**
 * Encodes a 64-bit signed integer into its wire-format varint representation
 * and stores it in the buffer. Integers that are not representable in 64 bits
 * will be truncated.
 * @param {number} value The integer to convert.
 */
BinaryEncoder.prototype.writeSignedVarint64 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= -TWO_TO_63 && value < TWO_TO_63);
  splitInt64(value);
  this.writeSplitVarint64(split64Low, split64High);
};

/**
 * Encodes a JavaScript integer into its wire-format, zigzag-encoded varint
 * representation and stores it in the buffer.
 * @param {number} value The integer to convert.
 */
BinaryEncoder.prototype.writeZigzagVarint32 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= -TWO_TO_31 && value < TWO_TO_31);
  this.writeUnsignedVarint32(((value << 1) ^ (value >> 31)) >>> 0);
};

/**
 * Encodes a JavaScript integer into its wire-format, zigzag-encoded varint
 * representation and stores it in the buffer. Integers not representable in 64
 * bits will be truncated.
 * @param {number} value The integer to convert.
 */
BinaryEncoder.prototype.writeZigzagVarint64 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= -TWO_TO_63 && value < TWO_TO_63);
  splitZigzag64(value);
  this.writeSplitVarint64(split64Low, split64High);
};

/**
 * Encodes a JavaScript decimal string into its wire-format, zigzag-encoded
 * varint representation and stores it in the buffer. Integers not representable
 * in 64 bits will be truncated.
 * @param {string} value The integer to convert.
 */
BinaryEncoder.prototype.writeZigzagVarint64String = function (value) {
  this.writeZigzagVarintHash64(decimalStringToHash64(value));
};

/**
 * Writes a 64-bit hash string (8 characters @ 8 bits of data each) to the
 * buffer as a zigzag varint.
 * @param {string} hash The hash to write.
 */
BinaryEncoder.prototype.writeZigzagVarintHash64 = function (hash) {
  const self = this;
  splitHash64(hash);
  toZigzag64(split64Low, split64High, function (lo, hi) {
    self.writeSplitVarint64(lo >>> 0, hi >>> 0);
  });
};

/**
 * Writes an 8-bit unsigned integer to the buffer. Numbers outside the range
 * [0,2^8) will be truncated.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeUint8 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= 0 && value < 256);
  this.buffer_.push((value >>> 0) & 0xff);
};

/**
 * Writes a 16-bit unsigned integer to the buffer. Numbers outside the
 * range [0,2^16) will be truncated.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeUint16 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= 0 && value < 65536);
  this.buffer_.push((value >>> 0) & 0xff);
  this.buffer_.push((value >>> 8) & 0xff);
};

/**
 * Writes a 32-bit unsigned integer to the buffer. Numbers outside the
 * range [0,2^32) will be truncated.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeUint32 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= 0 && value < TWO_TO_32);
  this.buffer_.push((value >>> 0) & 0xff);
  this.buffer_.push((value >>> 8) & 0xff);
  this.buffer_.push((value >>> 16) & 0xff);
  this.buffer_.push((value >>> 24) & 0xff);
};

/**
 * Writes a 64-bit unsigned integer to the buffer. Numbers outside the
 * range [0,2^64) will be truncated.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeUint64 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= 0 && value < TWO_TO_64);
  splitUint64(value);
  this.writeUint32(split64Low);
  this.writeUint32(split64High);
};

/**
 * Writes an 8-bit integer to the buffer. Numbers outside the range
 * [-2^7,2^7) will be truncated.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeInt8 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= -128 && value < 128);
  this.buffer_.push((value >>> 0) & 0xff);
};

/**
 * Writes a 16-bit integer to the buffer. Numbers outside the range
 * [-2^15,2^15) will be truncated.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeInt16 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= -32768 && value < 32768);
  this.buffer_.push((value >>> 0) & 0xff);
  this.buffer_.push((value >>> 8) & 0xff);
};

/**
 * Writes a 32-bit integer to the buffer. Numbers outside the range
 * [-2^31,2^31) will be truncated.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeInt32 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= -TWO_TO_31 && value < TWO_TO_31);
  this.buffer_.push((value >>> 0) & 0xff);
  this.buffer_.push((value >>> 8) & 0xff);
  this.buffer_.push((value >>> 16) & 0xff);
  this.buffer_.push((value >>> 24) & 0xff);
};

/**
 * Writes a 64-bit integer to the buffer. Numbers outside the range
 * [-2^63,2^63) will be truncated.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeInt64 = function (value) {
  assert(value == Math.floor(value));
  assert(value >= -TWO_TO_63 && value < TWO_TO_63);
  splitInt64(value);
  this.writeSplitFixed64(split64Low, split64High);
};

/**
 * Writes a 64-bit integer decimal strings to the buffer. Numbers outside the
 * range [-2^63,2^63) will be truncated.
 * @param {string} value The value to write.
 */
BinaryEncoder.prototype.writeInt64String = function (value) {
  assert(value == Math.floor(value));
  assert(+value >= -TWO_TO_63 && +value < TWO_TO_63);
  splitHash64(decimalStringToHash64(value));
  this.writeSplitFixed64(split64Low, split64High);
};

/**
 * Writes a single-precision floating point value to the buffer. Numbers
 * requiring more than 32 bits of precision will be truncated.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeFloat = function (value) {
  assert(
    value === Infinity ||
      value === -Infinity ||
      isNaN(value) ||
      (value >= -FLOAT32_MAX && value <= FLOAT32_MAX)
  );
  splitFloat32(value);
  this.writeUint32(split64Low);
};

/**
 * Writes a double-precision floating point value to the buffer. As this is
 * the native format used by JavaScript, no precision will be lost.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeDouble = function (value) {
  assert(
    value === Infinity ||
      value === -Infinity ||
      isNaN(value) ||
      (value >= -FLOAT64_MAX && value <= FLOAT64_MAX)
  );
  splitFloat64(value);
  this.writeUint32(split64Low);
  this.writeUint32(split64High);
};

/**
 * Writes a boolean value to the buffer as a varint. We allow numbers as input
 * because the JSPB code generator uses 0/1 instead of true/false to save space
 * in the string representation of the proto.
 * @param {boolean|number} value The value to write.
 */
BinaryEncoder.prototype.writeBool = function (value) {
  assert(typeof value === "boolean" || typeof value === "number");
  this.buffer_.push(value ? 1 : 0);
};

/**
 * Writes an enum value to the buffer as a varint.
 * @param {number} value The value to write.
 */
BinaryEncoder.prototype.writeEnum = function (value) {
  assert(value == Math.floor(value));
  assert(value >= -TWO_TO_31 && value < TWO_TO_31);
  this.writeSignedVarint32(value);
};

/**
 * Writes an arbitrary byte array to the buffer.
 * @param {!Uint8Array} bytes The array of bytes to write.
 */
BinaryEncoder.prototype.writeBytes = function (bytes) {
  this.buffer_.push.apply(this.buffer_, bytes);
};

/**
 * Writes a 64-bit hash string (8 characters @ 8 bits of data each) to the
 * buffer as a varint.
 * @param {string} hash The hash to write.
 */
BinaryEncoder.prototype.writeVarintHash64 = function (hash) {
  splitHash64(hash);
  this.writeSplitVarint64(split64Low, split64High);
};

/**
 * Writes a 64-bit hash string (8 characters @ 8 bits of data each) to the
 * buffer as a fixed64.
 * @param {string} hash The hash to write.
 */
BinaryEncoder.prototype.writeFixedHash64 = function (hash) {
  splitHash64(hash);
  this.writeUint32(split64Low);
  this.writeUint32(split64High);
};

/**
 * Writes a UTF16 Javascript string to the buffer encoded as UTF8.
 * @param {string} value The string to write.
 * @return {number} The number of bytes used to encode the string.
 */
BinaryEncoder.prototype.writeString = function (value) {
  const oldLength = this.buffer_.length;

  for (let i = 0; i < value.length; i++) {
    let c = value.charCodeAt(i);

    if (c < 128) {
      this.buffer_.push(c);
    } else if (c < 2048) {
      this.buffer_.push((c >> 6) | 192);
      this.buffer_.push((c & 63) | 128);
    } else if (c < 65536) {
      // Look for surrogates
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < value.length) {
        const second = value.charCodeAt(i + 1);
        if (second >= 0xdc00 && second <= 0xdfff) {
          // low surrogate
          // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
          c = (c - 0xd800) * 0x400 + second - 0xdc00 + 0x10000;

          this.buffer_.push((c >> 18) | 240);
          this.buffer_.push(((c >> 12) & 63) | 128);
          this.buffer_.push(((c >> 6) & 63) | 128);
          this.buffer_.push((c & 63) | 128);
          i++;
        }
      } else {
        this.buffer_.push((c >> 12) | 224);
        this.buffer_.push(((c >> 6) & 63) | 128);
        this.buffer_.push((c & 63) | 128);
      }
    }
  }

  const length = this.buffer_.length - oldLength;
  return length;
};
