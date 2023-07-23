import { assert } from "./goog/asserts.js";
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
} from "./utils.js";
import {
  TWO_TO_31,
  TWO_TO_63,
  TWO_TO_32,
  TWO_TO_64,
  FLOAT32_MAX,
  FLOAT64_MAX,
} from "./constants.js";
import { stringToUint8Array } from "./goog/crypt.js";

/**
 * BinaryEncoder implements encoders for all the wire types specified in
 * https://developers.google.com/protocol-buffers/docs/encoding.
 */
export class BinaryEncoder {
  buffer_: number[];
  constructor() {
    this.buffer_ = [];
  }

  length(): number {
    return this.buffer_.length;
  }

  end(): Array<number> {
    const buffer = this.buffer_;
    this.buffer_ = [];
    return buffer;
  }

  /**
   * Encodes a 64-bit integer in 32:32 split representation into its wire-format
   * varint representation and stores it in the buffer.
   */
  writeSplitVarint64(lowBits: number, highBits: number) {
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
  }

  /**
   * Encodes a 64-bit integer in 32:32 split representation into its wire-format
   * fixed representation and stores it in the buffer.
   */
  writeSplitFixed64(lowBits: number, highBits: number) {
    assert(lowBits == Math.floor(lowBits));
    assert(highBits == Math.floor(highBits));
    assert(lowBits >= 0 && lowBits < TWO_TO_32);
    assert(highBits >= 0 && highBits < TWO_TO_32);
    this.writeUint32(lowBits);
    this.writeUint32(highBits);
  }

  /**
   * Encodes a 32-bit unsigned integer into its wire-format varint representation
   * and stores it in the buffer.
   */
  writeUnsignedVarint32(value: number) {
    assert(value == Math.floor(value));
    assert(value >= 0 && value < TWO_TO_32);

    while (value > 127) {
      this.buffer_.push((value & 0x7f) | 0x80);
      value = value >>> 7;
    }

    this.buffer_.push(value);
  }

  /**
   * Encodes a 32-bit signed integer into its wire-format varint representation
   * and stores it in the buffer.
   */
  writeSignedVarint32(value: number) {
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
  }

  /**
   * Encodes a 64-bit unsigned integer into its wire-format varint representation
   * and stores it in the buffer. Integers that are not representable in 64 bits
   * will be truncated.
   */
  writeUnsignedVarint64(value: number) {
    assert(value == Math.floor(value));
    assert(value >= 0 && value < TWO_TO_64);
    splitInt64(value);
    this.writeSplitVarint64(split64Low, split64High);
  }

  /**
   * Encodes a 64-bit signed integer into its wire-format varint representation
   * and stores it in the buffer. Integers that are not representable in 64 bits
   * will be truncated.
   */
  writeSignedVarint64(value: number) {
    assert(value == Math.floor(value));
    assert(value >= -TWO_TO_63 && value < TWO_TO_63);
    splitInt64(value);
    this.writeSplitVarint64(split64Low, split64High);
  }

  /**
   * Encodes a JavaScript integer into its wire-format, zigzag-encoded varint
   * representation and stores it in the buffer.
   */
  writeZigzagVarint32(value: number) {
    assert(value == Math.floor(value));
    assert(value >= -TWO_TO_31 && value < TWO_TO_31);
    this.writeUnsignedVarint32(((value << 1) ^ (value >> 31)) >>> 0);
  }

  /**
   * Encodes a JavaScript integer into its wire-format, zigzag-encoded varint
   * representation and stores it in the buffer. Integers not representable in 64
   * bits will be truncated.
   */
  writeZigzagVarint64(value: number) {
    assert(value == Math.floor(value));
    assert(value >= -TWO_TO_63 && value < TWO_TO_63);
    splitZigzag64(value);
    this.writeSplitVarint64(split64Low, split64High);
  }

  /**
   * Encodes a JavaScript decimal string into its wire-format, zigzag-encoded
   * varint representation and stores it in the buffer. Integers not representable
   * in 64 bits will be truncated.
   */
  writeZigzagVarint64String(value: string) {
    this.writeZigzagVarintHash64(decimalStringToHash64(value));
  }

  /**
   * Writes a 64-bit hash string (8 characters @ 8 bits of data each) to the
   * buffer as a zigzag varint.
   */
  writeZigzagVarintHash64(hash: string) {
    splitHash64(hash);
    toZigzag64(split64Low, split64High, (lo, hi) => {
      this.writeSplitVarint64(lo >>> 0, hi >>> 0);
    });
  }

  /**
   * Writes an 8-bit unsigned integer to the buffer. Numbers outside the range
   * [0,2^8) will be truncated.
   */
  writeUint8(value: number) {
    assert(value == Math.floor(value));
    assert(value >= 0 && value < 256);
    this.buffer_.push((value >>> 0) & 0xff);
  }

  /**
   * Writes a 16-bit unsigned integer to the buffer. Numbers outside the
   * range [0,2^16) will be truncated.
   */
  writeUint16(value: number) {
    assert(value == Math.floor(value));
    assert(value >= 0 && value < 65536);
    this.buffer_.push((value >>> 0) & 0xff);
    this.buffer_.push((value >>> 8) & 0xff);
  }

  /**
   * Writes a 32-bit unsigned integer to the buffer. Numbers outside the
   * range [0,2^32) will be truncated.
   */
  writeUint32(value: number) {
    assert(value == Math.floor(value));
    assert(value >= 0 && value < TWO_TO_32);
    this.buffer_.push((value >>> 0) & 0xff);
    this.buffer_.push((value >>> 8) & 0xff);
    this.buffer_.push((value >>> 16) & 0xff);
    this.buffer_.push((value >>> 24) & 0xff);
  }

  /**
   * Writes a 64-bit unsigned integer to the buffer. Numbers outside the
   * range [0,2^64) will be truncated.
   */
  writeUint64(value: number) {
    assert(value == Math.floor(value));
    assert(value >= 0 && value < TWO_TO_64);
    splitUint64(value);
    this.writeUint32(split64Low);
    this.writeUint32(split64High);
  }

  /**
   * Writes an 8-bit integer to the buffer. Numbers outside the range
   * [-2^7,2^7) will be truncated.
   */
  writeInt8(value: number) {
    assert(value == Math.floor(value));
    assert(value >= -128 && value < 128);
    this.buffer_.push((value >>> 0) & 0xff);
  }

  /**
   * Writes a 16-bit integer to the buffer. Numbers outside the range
   * [-2^15,2^15) will be truncated.
   */
  writeInt16(value: number) {
    assert(value == Math.floor(value));
    assert(value >= -32768 && value < 32768);
    this.buffer_.push((value >>> 0) & 0xff);
    this.buffer_.push((value >>> 8) & 0xff);
  }

  /**
   * Writes a 32-bit integer to the buffer. Numbers outside the range
   * [-2^31,2^31) will be truncated.
   */
  writeInt32(value: number) {
    assert(value == Math.floor(value));
    assert(value >= -TWO_TO_31 && value < TWO_TO_31);
    this.buffer_.push((value >>> 0) & 0xff);
    this.buffer_.push((value >>> 8) & 0xff);
    this.buffer_.push((value >>> 16) & 0xff);
    this.buffer_.push((value >>> 24) & 0xff);
  }

  /**
   * Writes a 64-bit integer to the buffer. Numbers outside the range
   * [-2^63,2^63) will be truncated.
   */
  writeInt64(value: number) {
    assert(value == Math.floor(value));
    assert(value >= -TWO_TO_63 && value < TWO_TO_63);
    splitInt64(value);
    this.writeSplitFixed64(split64Low, split64High);
  }

  /**
   * Writes a 64-bit integer decimal strings to the buffer. Numbers outside the
   * range [-2^63,2^63) will be truncated.
   */
  writeInt64String(value: string) {
    assert(
      (value as unknown as number) == Math.floor(value as unknown as number),
    );
    assert(+value >= -TWO_TO_63 && +value < TWO_TO_63);
    splitHash64(decimalStringToHash64(value));
    this.writeSplitFixed64(split64Low, split64High);
  }

  /**
   * Writes a single-precision floating point value to the buffer. Numbers
   * requiring more than 32 bits of precision will be truncated.
   */
  writeFloat(value: number) {
    assert(
      value === Infinity ||
        value === -Infinity ||
        isNaN(value) ||
        (value >= -FLOAT32_MAX && value <= FLOAT32_MAX),
    );
    splitFloat32(value);
    this.writeUint32(split64Low);
  }

  /**
   * Writes a double-precision floating point value to the buffer. As this is
   * the native format used by JavaScript, no precision will be lost.
   */
  writeDouble(value: number) {
    assert(
      value === Infinity ||
        value === -Infinity ||
        isNaN(value) ||
        (value >= -FLOAT64_MAX && value <= FLOAT64_MAX),
    );
    splitFloat64(value);
    this.writeUint32(split64Low);
    this.writeUint32(split64High);
  }

  /**
   * Writes a boolean value to the buffer as a varint. We allow numbers as input
   * because the JSPB code generator uses 0/1 instead of true/false to save space
   * in the string representation of the proto.
   */
  writeBool(value: boolean | number) {
    assert(typeof value === "boolean" || typeof value === "number");
    this.buffer_.push(value ? 1 : 0);
  }

  /**
   * Writes an enum value to the buffer as a varint.
   */
  writeEnum(value: number) {
    assert(value == Math.floor(value));
    assert(value >= -TWO_TO_31 && value < TWO_TO_31);
    this.writeSignedVarint32(value);
  }

  /**
   * Writes an arbitrary byte array to the buffer.
   */
  writeBytes(bytes: Uint8Array) {
    this.buffer_.push(...bytes);
  }

  /**
   * Writes a 64-bit hash string (8 characters @ 8 bits of data each) to the
   * buffer as a varint.
   */
  writeVarintHash64(hash: string) {
    splitHash64(hash);
    this.writeSplitVarint64(split64Low, split64High);
  }

  /**
   * Writes a 64-bit hash string (8 characters @ 8 bits of data each) to the
   * buffer as a fixed64.
   */
  writeFixedHash64(hash: string) {
    splitHash64(hash);
    this.writeUint32(split64Low);
    this.writeUint32(split64High);
  }

  /**
   * Writes a UTF16 Javascript string to the buffer encoded as UTF8.
   */
  writeString(value: string): number {
    const oldLength = this.buffer_.length;
    const buffer = stringToUint8Array(value);
    buffer.forEach((val) => this.buffer_.push(val));
    const length = this.buffer_.length - oldLength;
    return length;
  }
}
