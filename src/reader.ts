/* eslint-disable @typescript-eslint/unbound-method */

import { assert, fail } from "./goog/asserts";
import {
  WireType,
  FieldTypeToWireType,
  FieldType,
  INVALID_FIELD_NUMBER,
} from "./constants";
import { BinaryDecoder } from "./decoder";
import { ByteSource } from "./utils";

/**
 * BinaryReader implements the decoders for all the wire types specified in
 * https://developers.google.com/protocol-buffers/docs/encoding.
 *
 * @param {jspb.ByteSource=} opt_bytes The bytes we're reading from.
 * @param {number=} opt_start The optional offset to start reading at.
 * @param {number=} opt_length The optional length of the block to read -
 *     we'll throw an assertion if we go off the end of the block.
 * @constructor
 * @struct
 */
export class BinaryReader {
  /**
   * Global pool of BinaryReader instances.
   * @private {!Array<!BinaryReader>}
   */
  static instanceCache_: BinaryReader[] = [];

  /**
   * Pops an instance off the instance cache, or creates one if the cache is
   * empty.
   * @param {ByteSource=} opt_bytes The bytes we're reading from.
   * @param {number=} opt_start The optional offset to start reading at.
   * @param {number=} opt_length The optional length of the block to read -
   *     we'll throw an assertion if we go off the end of the block.
   * @return {!BinaryReader}
   */
  static alloc(
    opt_bytes: ByteSource | undefined,
    opt_start: number | undefined,
    opt_length: number | undefined
  ): BinaryReader {
    const newReader = BinaryReader.instanceCache_.pop();
    if (newReader) {
      if (opt_bytes) {
        newReader.decoder_.setBlock(opt_bytes, opt_start, opt_length);
      }
      return newReader;
    } else {
      return new BinaryReader(opt_bytes, opt_start, opt_length);
    }
  }

  decoder_: BinaryDecoder;
  fieldCursor_: number;
  nextField_: number;
  nextWireType_: WireType;
  error_: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readCallbacks_: Record<string, (reader: BinaryReader) => any>;

  constructor(
    opt_bytes: ByteSource | undefined,
    opt_start: number | undefined,
    opt_length: number | undefined
  ) {
    /**
     * Wire-format decoder.
     * @private {!BinaryDecoder}
     */
    this.decoder_ = BinaryDecoder.alloc(opt_bytes, opt_start, opt_length);

    /**
     * Cursor immediately before the field tag.
     * @private {number}
     */
    this.fieldCursor_ = this.decoder_.getCursor();

    /**
     * Field number of the next field in the buffer, filled in by nextField().
     * @private {number}
     */
    this.nextField_ = INVALID_FIELD_NUMBER;

    /**
     * Wire type of the next proto field in the buffer, filled in by
     * nextField().
     * @private {WireType}
     */
    this.nextWireType_ = WireType.INVALID;

    /**
     * Set to true if this reader encountered an error due to corrupt data.
     * @private {boolean}
     */
    this.error_ = false;

    /**
     * User-defined reader callbacks.
     * @private {?Object<string, function(!BinaryReader):*>}
     */
    this.readCallbacks_ = {};
  }

  /**
   * Puts this instance back in the instance cache.
   */
  free() {
    this.decoder_.clear();
    this.nextField_ = INVALID_FIELD_NUMBER;
    this.nextWireType_ = WireType.INVALID;
    this.error_ = false;
    this.readCallbacks_ = {};

    if (BinaryReader.instanceCache_.length < 100) {
      BinaryReader.instanceCache_.push(this);
    }
  }

  /**
   * Returns the cursor immediately before the current field's tag.
   * @return {number} The internal read cursor.
   */
  getFieldCursor(): number {
    return this.fieldCursor_;
  }

  /**
   * Returns the internal read cursor.
   * @return {number} The internal read cursor.
   */
  getCursor(): number {
    return this.decoder_.getCursor();
  }

  /**
   * Returns the raw buffer.
   * @return {?Uint8Array} The raw buffer.
   */
  getBuffer(): Uint8Array | undefined {
    return this.decoder_.getBuffer();
  }

  /**
   * @return {number} The field number of the next field in the buffer, or
   *     INVALID_FIELD_NUMBER if there is no next field.
   */
  getFieldNumber(): number {
    return this.nextField_;
  }

  /**
   * @return {WireType} The wire type of the next field
   *     in the stream, or WireType.INVALID if there is no next field.
   */
  getWireType(): WireType {
    return this.nextWireType_;
  }

  /**
   * @return {boolean} Whether the current wire type is a delimited field. Used to
   * conditionally parse packed repeated fields.
   */
  isDelimited(): boolean {
    return this.nextWireType_ == WireType.DELIMITED;
  }

  /**
   * @return {boolean} Whether the current wire type is an end-group tag. Used as
   * an exit condition in decoder loops in generated code.
   */
  isEndGroup(): boolean {
    return this.nextWireType_ == WireType.END_GROUP;
  }

  /**
   * Returns true if this reader hit an error due to corrupt data.
   * @return {boolean}
   */
  getError(): boolean {
    return this.error_ || this.decoder_.getError();
  }

  /**
   * Points this reader at a new block of bytes.
   * @param {!Uint8Array} bytes The block of bytes we're reading from.
   * @param {number} start The offset to start reading at.
   * @param {number} length The length of the block to read.
   */
  setBlock(bytes: Uint8Array, start: number, length: number) {
    this.decoder_.setBlock(bytes, start, length);
    this.nextField_ = INVALID_FIELD_NUMBER;
    this.nextWireType_ = WireType.INVALID;
  }

  /**
   * Rewinds the stream cursor to the beginning of the buffer and resets all
   * internal state.
   */
  reset() {
    this.decoder_.reset();
    this.nextField_ = INVALID_FIELD_NUMBER;
    this.nextWireType_ = WireType.INVALID;
  }

  /**
   * Advances the stream cursor by the given number of bytes.
   * @param {number} count The number of bytes to advance by.
   */
  advance(count: number) {
    this.decoder_.advance(count);
  }

  /**
   * Reads the next field header in the stream if there is one, returns true if
   * we saw a valid field header or false if we've read the whole stream.
   * Throws an error if we encountered a deprecated START_GROUP/END_GROUP field.
   * @return {boolean} True if the stream contains more fields.
   */
  nextField(): boolean {
    // If we're at the end of the block, there are no more fields.
    if (this.decoder_.atEnd()) {
      return false;
    }

    // If we hit an error decoding the previous field, stop now before we
    // try to decode anything else
    if (this.getError()) {
      fail("Decoder hit an error");
      return false;
    }

    // Otherwise just read the header of the next field.
    this.fieldCursor_ = this.decoder_.getCursor();
    const header = this.decoder_.readUnsignedVarint32();

    const nextField = header >>> 3;
    const nextWireType = /** @type {WireType} */ header & 0x7;

    // If the wire type isn't one of the valid ones, something's broken.
    if (
      nextWireType != WireType.VARINT &&
      nextWireType != WireType.FIXED32 &&
      nextWireType != WireType.FIXED64 &&
      nextWireType != WireType.DELIMITED &&
      nextWireType != WireType.START_GROUP &&
      nextWireType != WireType.END_GROUP
    ) {
      fail(
        `Invalid wire type: ${nextWireType} (at position ${this.fieldCursor_})`
      );
      this.error_ = true;
      return false;
    }

    this.nextField_ = nextField;
    this.nextWireType_ = nextWireType;

    return true;
  }

  /**
   * Winds the reader back to just before this field's header.
   */
  unskipHeader() {
    this.decoder_.unskipVarint((this.nextField_ << 3) | this.nextWireType_);
  }

  /**
   * Skips all contiguous fields whose header matches the one we just read.
   */
  skipMatchingFields() {
    const field = this.nextField_;
    this.unskipHeader();

    while (this.nextField() && this.getFieldNumber() == field) {
      this.skipField();
    }

    if (!this.decoder_.atEnd()) {
      this.unskipHeader();
    }
  }

  /**
   * Skips over the next varint field in the binary stream.
   */
  skipVarintField() {
    if (this.nextWireType_ != WireType.VARINT) {
      fail("Invalid wire type for skipVarintField");
      this.skipField();
      return;
    }

    this.decoder_.skipVarint();
  }

  /**
   * Skips over the next delimited field in the binary stream.
   */
  skipDelimitedField() {
    if (this.nextWireType_ != WireType.DELIMITED) {
      fail("Invalid wire type for skipDelimitedField");
      this.skipField();
      return;
    }

    const length = this.decoder_.readUnsignedVarint32();
    this.decoder_.advance(length);
  }

  /**
   * Skips over the next fixed32 field in the binary stream.
   */
  skipFixed32Field() {
    if (this.nextWireType_ != WireType.FIXED32) {
      fail("Invalid wire type for skipFixed32Field");
      this.skipField();
      return;
    }

    this.decoder_.advance(4);
  }

  /**
   * Skips over the next fixed64 field in the binary stream.
   */
  skipFixed64Field() {
    if (this.nextWireType_ != WireType.FIXED64) {
      fail("Invalid wire type for skipFixed64Field");
      this.skipField();
      return;
    }

    this.decoder_.advance(8);
  }

  /**
   * Skips over the next group field in the binary stream.
   */
  skipGroup() {
    const previousField = this.nextField_;
    // eslint-disable-next-line no-constant-condition , @typescript-eslint/no-unnecessary-condition
    while (true) {
      if (!this.nextField()) {
        fail("Unmatched start-group tag: stream EOF");
        this.error_ = true;
        return;
      }
      if (this.nextWireType_ == WireType.END_GROUP) {
        // Group end: check that it matches top-of-stack.
        if (this.nextField_ != previousField) {
          fail("Unmatched end-group tag");
          this.error_ = true;
          return;
        }
        return;
      }
      this.skipField();
    }
  }

  /**
   * Skips over the next field in the binary stream - this is useful if we're
   * decoding a message that contain unknown fields.
   */
  skipField() {
    switch (this.nextWireType_) {
      case WireType.VARINT:
        this.skipVarintField();
        break;
      case WireType.FIXED64:
        this.skipFixed64Field();
        break;
      case WireType.DELIMITED:
        this.skipDelimitedField();
        break;
      case WireType.FIXED32:
        this.skipFixed32Field();
        break;
      case WireType.START_GROUP:
        this.skipGroup();
        break;
      default:
        fail("Invalid wire encoding for field.");
    }
  }

  /**
   * Registers a user-defined read callback.
   * @param {string} callbackName
   * @param {function(!BinaryReader):*} callback
   */
  registerReadCallback(
    callbackName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (arg0: BinaryReader) => any
  ) {
    assert(!this.readCallbacks_[callbackName]);
    this.readCallbacks_[callbackName] = callback;
  }

  /**
   * Runs a registered read callback.
   * @param {string} callbackName The name the callback is registered under.
   * @return {*} The value returned by the callback.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runReadCallback(callbackName: string): any {
    const callback = this.readCallbacks_[callbackName];
    assert(!!callback);
    return callback(this);
  }

  /**
   * Reads a field of any valid non-message type from the binary stream.
   * @param {FieldType} fieldType
   * @return {AnyFieldType}
   */
  readAny(fieldType: FieldType): number | boolean | string | Uint8Array {
    this.nextWireType_ = FieldTypeToWireType(fieldType);
    switch (fieldType) {
      case FieldType.DOUBLE:
        return this.readDouble();
      case FieldType.FLOAT:
        return this.readFloat();
      case FieldType.INT64:
        return this.readInt64();
      case FieldType.UINT64:
        return this.readUint64();
      case FieldType.INT32:
        return this.readInt32();
      case FieldType.FIXED64:
        return this.readFixed64();
      case FieldType.FIXED32:
        return this.readFixed32();
      case FieldType.BOOL:
        return this.readBool();
      case FieldType.STRING:
        return this.readString();
      case FieldType.GROUP:
        fail("Group field type not supported in readAny()");
        break;
      case FieldType.MESSAGE:
        fail("Message field type not supported in readAny()");
        break;
      case FieldType.BYTES:
        return this.readBytes();
      case FieldType.UINT32:
        return this.readUint32();
      case FieldType.ENUM:
        return this.readEnum();
      case FieldType.SFIXED32:
        return this.readSfixed32();
      case FieldType.SFIXED64:
        return this.readSfixed64();
      case FieldType.SINT32:
        return this.readSint32();
      case FieldType.SINT64:
        return this.readSint64();
      case FieldType.FHASH64:
        return this.readFixedHash64();
      case FieldType.VHASH64:
        return this.readVarintHash64();
      default:
        fail("Invalid field type in readAny()");
    }
    return 0;
  }

  /**
   * Deserialize a proto into the provided message object using the provided
   * reader function. This function is templated as we currently have one client
   * who is using manual deserialization instead of the code-generated versions.
   * @template T
   * @param {T} message
   * @param {function(T, !BinaryReader)} reader
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readMessage<T>(message: T, reader: (arg0: T, arg1: BinaryReader) => any) {
    assert(this.nextWireType_ == WireType.DELIMITED);

    // Save the current endpoint of the decoder and move it to the end of the
    // embedded message.
    const oldEnd = this.decoder_.getEnd();
    const length = this.decoder_.readUnsignedVarint32();
    const newEnd = this.decoder_.getCursor() + length;
    this.decoder_.setEnd(newEnd);

    // Deserialize the embedded message.
    reader(message, this);

    // Advance the decoder past the embedded message and restore the endpoint.
    this.decoder_.setCursor(newEnd);
    this.decoder_.setEnd(oldEnd);
  }

  /**
   * Deserialize a proto into the provided message object using the provided
   * reader function, assuming that the message is serialized as a group
   * with the given tag.
   * @template T
   * @param {number} field
   * @param {T} message
   * @param {function(T, !BinaryReader)} reader
   */
  readGroup<T>(
    field: number,
    message: T,
    reader: (arg0: T, arg1: BinaryReader) => T
  ) {
    // Ensure that the wire type is correct.
    assert(this.nextWireType_ == WireType.START_GROUP);
    // Ensure that the field number is correct.
    assert(this.nextField_ == field);

    // Deserialize the message. The deserialization will stop at an END_GROUP tag.
    reader(message, this);

    if (!this.error_ && this.nextWireType_ != WireType.END_GROUP) {
      fail("Group submessage did not end with an END_GROUP tag");
      this.error_ = true;
    }
  }

  /**
   * Return a decoder that wraps the current delimited field.
   * @return {!BinaryDecoder}
   */
  getFieldDecoder(): BinaryDecoder {
    assert(this.nextWireType_ == WireType.DELIMITED);

    const length = this.decoder_.readUnsignedVarint32();
    const start = this.decoder_.getCursor();
    const end = start + length;

    const innerDecoder = BinaryDecoder.alloc(
      this.decoder_.getBuffer(),
      start,
      length
    );
    this.decoder_.setCursor(end);
    return innerDecoder;
  }

  /**
   * Reads a signed 32-bit integer field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * @return {number} The value of the signed 32-bit integer field.
   */
  readInt32(): number {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readSignedVarint32();
  }

  /**
   * Reads a signed 32-bit integer field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * Returns the value as a string.
   *
   * @return {string} The value of the signed 32-bit integer field as a decimal
   * string.
   */
  readInt32String(): string {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readSignedVarint32String();
  }

  /**
   * Reads a signed 64-bit integer field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * @return {number} The value of the signed 64-bit integer field.
   */
  readInt64(): number {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readSignedVarint64();
  }

  /**
   * Reads a signed 64-bit integer field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * Returns the value as a string.
   *
   * @return {string} The value of the signed 64-bit integer field as a decimal
   * string.
   */
  readInt64String(): string {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readSignedVarint64String();
  }

  /**
   * Reads an unsigned 32-bit integer field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * @return {number} The value of the unsigned 32-bit integer field.
   */
  readUint32(): number {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readUnsignedVarint32();
  }

  /**
   * Reads an unsigned 32-bit integer field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * Returns the value as a string.
   *
   * @return {string} The value of the unsigned 32-bit integer field as a decimal
   * string.
   */
  readUint32String(): string {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readUnsignedVarint32String();
  }

  /**
   * Reads an unsigned 64-bit integer field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * @return {number} The value of the unsigned 64-bit integer field.
   */
  readUint64(): number {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readUnsignedVarint64();
  }

  /**
   * Reads an unsigned 64-bit integer field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * Returns the value as a string.
   *
   * @return {string} The value of the unsigned 64-bit integer field as a decimal
   * string.
   */
  readUint64String(): string {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readUnsignedVarint64String();
  }

  /**
   * Reads a signed zigzag-encoded 32-bit integer field from the binary stream,
   * or throws an error if the next field in the stream is not of the correct
   * wire type.
   *
   * @return {number} The value of the signed 32-bit integer field.
   */
  readSint32(): number {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readZigzagVarint32();
  }

  /**
   * Reads a signed zigzag-encoded 64-bit integer field from the binary stream,
   * or throws an error if the next field in the stream is not of the correct
   * wire type.
   *
   * @return {number} The value of the signed 64-bit integer field.
   */
  readSint64(): number {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readZigzagVarint64();
  }

  /**
   * Reads a signed zigzag-encoded 64-bit integer field from the binary stream,
   * or throws an error if the next field in the stream is not of the correct
   * wire type.
   *
   * @return {string} The value of the signed 64-bit integer field as a decimal string.
   */
  readSint64String(): string {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readZigzagVarint64String();
  }

  /**
   * Reads an unsigned 32-bit fixed-length integer fiield from the binary stream,
   * or throws an error if the next field in the stream is not of the correct
   * wire type.
   *
   * @return {number} The value of the double field.
   */
  readFixed32(): number {
    assert(this.nextWireType_ == WireType.FIXED32);
    return this.decoder_.readUint32();
  }

  /**
   * Reads an unsigned 64-bit fixed-length integer fiield from the binary stream,
   * or throws an error if the next field in the stream is not of the correct
   * wire type.
   *
   * @return {number} The value of the float field.
   */
  readFixed64(): number {
    assert(this.nextWireType_ == WireType.FIXED64);
    return this.decoder_.readUint64();
  }

  /**
   * Reads a signed 64-bit integer field from the binary stream as a string, or
   * throws an error if the next field in the stream is not of the correct wire
   * type.
   *
   * Returns the value as a string.
   *
   * @return {string} The value of the unsigned 64-bit integer field as a decimal
   * string.
   */
  readFixed64String(): string {
    assert(this.nextWireType_ == WireType.FIXED64);
    return this.decoder_.readUint64String();
  }

  /**
   * Reads a signed 32-bit fixed-length integer fiield from the binary stream, or
   * throws an error if the next field in the stream is not of the correct wire
   * type.
   *
   * @return {number} The value of the signed 32-bit integer field.
   */
  readSfixed32(): number {
    assert(this.nextWireType_ == WireType.FIXED32);
    return this.decoder_.readInt32();
  }

  /**
   * Reads a signed 32-bit fixed-length integer fiield from the binary stream, or
   * throws an error if the next field in the stream is not of the correct wire
   * type.
   *
   * @return {string} The value of the signed 32-bit integer field as a decimal
   * string.
   */
  readSfixed32String(): string {
    assert(this.nextWireType_ == WireType.FIXED32);
    return this.decoder_.readInt32().toString();
  }

  /**
   * Reads a signed 64-bit fixed-length integer fiield from the binary stream, or
   * throws an error if the next field in the stream is not of the correct wire
   * type.
   *
   * @return {number} The value of the sfixed64 field.
   */
  readSfixed64(): number {
    assert(this.nextWireType_ == WireType.FIXED64);
    return this.decoder_.readInt64();
  }

  /**
   * Reads a signed 64-bit fixed-length integer fiield from the binary stream, or
   * throws an error if the next field in the stream is not of the correct wire
   * type.
   *
   * Returns the value as a string.
   *
   * @return {string} The value of the sfixed64 field as a decimal string.
   */
  readSfixed64String(): string {
    assert(this.nextWireType_ == WireType.FIXED64);
    return this.decoder_.readInt64String();
  }

  /**
   * Reads a 32-bit floating-point field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * @return {number} The value of the float field.
   */
  readFloat(): number {
    assert(this.nextWireType_ == WireType.FIXED32);
    return this.decoder_.readFloat();
  }

  /**
   * Reads a 64-bit floating-point field from the binary stream, or throws an
   * error if the next field in the stream is not of the correct wire type.
   *
   * @return {number} The value of the double field.
   */
  readDouble(): number {
    assert(this.nextWireType_ == WireType.FIXED64);
    return this.decoder_.readDouble();
  }

  /**
   * Reads a boolean field from the binary stream, or throws an error if the next
   * field in the stream is not of the correct wire type.
   *
   * @return {boolean} The value of the boolean field.
   */
  readBool(): boolean {
    assert(this.nextWireType_ == WireType.VARINT);
    return !!this.decoder_.readUnsignedVarint32();
  }

  /**
   * Reads an enum field from the binary stream, or throws an error if the next
   * field in the stream is not of the correct wire type.
   *
   * @return {number} The value of the enum field.
   */
  readEnum(): number {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readSignedVarint64();
  }

  /**
   * Reads a string field from the binary stream, or throws an error if the next
   * field in the stream is not of the correct wire type.
   *
   * @return {string} The value of the string field.
   */
  readString(): string {
    assert(this.nextWireType_ == WireType.DELIMITED);
    const length = this.decoder_.readUnsignedVarint32();
    return this.decoder_.readString(length);
  }

  /**
   * Reads a length-prefixed block of bytes from the binary stream, or returns
   * null if the next field in the stream has an invalid length value.
   *
   * @return {!Uint8Array} The block of bytes.
   */
  readBytes(): Uint8Array {
    assert(this.nextWireType_ == WireType.DELIMITED);
    const length = this.decoder_.readUnsignedVarint32();
    return this.decoder_.readBytes(length);
  }

  /**
   * Reads a 64-bit varint or fixed64 field from the stream and returns it as an
   * 8-character Unicode string for use as a hash table key, or throws an error
   * if the next field in the stream is not of the correct wire type.
   *
   * @return {string} The hash value.
   */
  readVarintHash64(): string {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readVarintHash64();
  }

  /**
   * Reads an sint64 field from the stream and returns it as an 8-character
   * Unicode string for use as a hash table key, or throws an error if the next
   * field in the stream is not of the correct wire type.
   *
   * @return {string} The hash value.
   */
  readSintHash64(): string {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readZigzagVarintHash64();
  }

  /**
   * Reads a 64-bit varint field from the stream and invokes `convert` to produce
   * the return value, or throws an error if the next field in the stream is not
   * of the correct wire type.
   *
   * @param {function(number, number): T} convert Conversion function to produce
   *     the result value, takes parameters (lowBits, highBits).
   * @return {T}
   * @template T
   */
  readSplitVarint64<T>(convert: (arg0: number, arg1: number) => T): T {
    assert(this.nextWireType_ == WireType.VARINT);
    return this.decoder_.readSplitVarint64(convert);
  }

  /**
   * Reads a 64-bit varint or fixed64 field from the stream and returns it as a
   * 8-character Unicode string for use as a hash table key, or throws an error
   * if the next field in the stream is not of the correct wire type.
   *
   * @return {string} The hash value.
   */
  readFixedHash64(): string {
    assert(this.nextWireType_ == WireType.FIXED64);
    return this.decoder_.readFixedHash64();
  }

  /**
   * Reads a 64-bit fixed64 field from the stream and invokes `convert`
   * to produce the return value, or throws an error if the next field in the
   * stream is not of the correct wire type.
   *
   * @param {function(number, number): T} convert Conversion function to produce
   *     the result value, takes parameters (lowBits, highBits).
   * @return {T}
   * @template T
   */
  readSplitFixed64<T>(convert: (arg0: number, arg1: number) => T): T {
    assert(this.nextWireType_ == WireType.FIXED64);
    return this.decoder_.readSplitFixed64(convert);
  }

  /**
   * Reads a packed scalar field using the supplied raw reader function.
   * @param {function(this:BinaryDecoder)} decodeMethod
   * @return {!Array}
   * @private
   */
  readPackedField_<T>(decodeMethod: (this: BinaryDecoder) => T): Array<T> {
    assert(this.nextWireType_ == WireType.DELIMITED);
    const length = this.decoder_.readUnsignedVarint32();
    const end = this.decoder_.getCursor() + length;
    const result = [];
    while (this.decoder_.getCursor() < end) {
      result.push(decodeMethod.call(this.decoder_));
    }
    return result;
  }

  /**
   * Reads a packed int32 field, which consists of a length header and a list of
   * signed varints.
   * @return {!Array<number>}
   */
  readPackedInt32(): Array<number> {
    return this.readPackedField_(this.decoder_.readSignedVarint32);
  }

  /**
   * Reads a packed int32 field, which consists of a length header and a list of
   * signed varints. Returns a list of strings.
   * @return {!Array<string>}
   */
  readPackedInt32String(): Array<string> {
    return this.readPackedField_(this.decoder_.readSignedVarint32String);
  }

  /**
   * Reads a packed int64 field, which consists of a length header and a list of
   * signed varints.
   * @return {!Array<number>}
   */
  readPackedInt64(): Array<number> {
    return this.readPackedField_(this.decoder_.readSignedVarint64);
  }

  /**
   * Reads a packed int64 field, which consists of a length header and a list of
   * signed varints. Returns a list of strings.
   * @return {!Array<string>}
   */
  readPackedInt64String(): Array<string> {
    return this.readPackedField_(this.decoder_.readSignedVarint64String);
  }

  /**
   * Reads a packed uint32 field, which consists of a length header and a list of
   * unsigned varints.
   * @return {!Array<number>}
   */
  readPackedUint32(): Array<number> {
    return this.readPackedField_(this.decoder_.readUnsignedVarint32);
  }

  /**
   * Reads a packed uint32 field, which consists of a length header and a list of
   * unsigned varints. Returns a list of strings.
   * @return {!Array<string>}
   */
  readPackedUint32String(): Array<string> {
    return this.readPackedField_(this.decoder_.readUnsignedVarint32String);
  }

  /**
   * Reads a packed uint64 field, which consists of a length header and a list of
   * unsigned varints.
   * @return {!Array<number>}
   */
  readPackedUint64(): Array<number> {
    return this.readPackedField_(this.decoder_.readUnsignedVarint64);
  }

  /**
   * Reads a packed uint64 field, which consists of a length header and a list of
   * unsigned varints. Returns a list of strings.
   * @return {!Array<string>}
   */
  readPackedUint64String(): Array<string> {
    return this.readPackedField_(this.decoder_.readUnsignedVarint64String);
  }

  /**
   * Reads a packed sint32 field, which consists of a length header and a list of
   * zigzag varints.
   * @return {!Array<number>}
   */
  readPackedSint32(): Array<number> {
    return this.readPackedField_(this.decoder_.readZigzagVarint32);
  }

  /**
   * Reads a packed sint64 field, which consists of a length header and a list of
   * zigzag varints.
   * @return {!Array<number>}
   */
  readPackedSint64(): Array<number> {
    return this.readPackedField_(this.decoder_.readZigzagVarint64);
  }

  /**
   * Reads a packed sint64 field, which consists of a length header and a list of
   * zigzag varints.  Returns a list of strings.
   * @return {!Array<string>}
   */
  readPackedSint64String(): Array<string> {
    return this.readPackedField_(this.decoder_.readZigzagVarint64String);
  }

  /**
   * Reads a packed fixed32 field, which consists of a length header and a list
   * of unsigned 32-bit ints.
   * @return {!Array<number>}
   */
  readPackedFixed32(): Array<number> {
    return this.readPackedField_(this.decoder_.readUint32);
  }

  /**
   * Reads a packed fixed64 field, which consists of a length header and a list
   * of unsigned 64-bit ints.
   * @return {!Array<number>}
   */
  readPackedFixed64(): Array<number> {
    return this.readPackedField_(this.decoder_.readUint64);
  }

  /**
   * Reads a packed fixed64 field, which consists of a length header and a list
   * of unsigned 64-bit ints.  Returns a list of strings.
   * @return {!Array<string>}
   */
  readPackedFixed64String(): Array<string> {
    return this.readPackedField_(this.decoder_.readUint64String);
  }

  /**
   * Reads a packed sfixed32 field, which consists of a length header and a list
   * of 32-bit ints.
   * @return {!Array<number>}
   */
  readPackedSfixed32(): Array<number> {
    return this.readPackedField_(this.decoder_.readInt32);
  }

  /**
   * Reads a packed sfixed64 field, which consists of a length header and a list
   * of 64-bit ints.
   * @return {!Array<number>}
   */
  readPackedSfixed64(): Array<number> {
    return this.readPackedField_(this.decoder_.readInt64);
  }

  /**
   * Reads a packed sfixed64 field, which consists of a length header and a list
   * of 64-bit ints.  Returns a list of strings.
   * @return {!Array<string>}
   */
  readPackedSfixed64String(): Array<string> {
    return this.readPackedField_(this.decoder_.readInt64String);
  }

  /**
   * Reads a packed float field, which consists of a length header and a list of
   * floats.
   * @return {!Array<number>}
   */
  readPackedFloat(): Array<number> {
    return this.readPackedField_(this.decoder_.readFloat);
  }

  /**
   * Reads a packed double field, which consists of a length header and a list of
   * doubles.
   * @return {!Array<number>}
   */
  readPackedDouble(): Array<number> {
    return this.readPackedField_(this.decoder_.readDouble);
  }

  /**
   * Reads a packed bool field, which consists of a length header and a list of
   * unsigned varints.
   * @return {!Array<boolean>}
   */
  readPackedBool(): Array<boolean> {
    return this.readPackedField_(this.decoder_.readBool);
  }

  /**
   * Reads a packed enum field, which consists of a length header and a list of
   * unsigned varints.
   * @return {!Array<number>}
   */
  readPackedEnum(): Array<number> {
    return this.readPackedField_(this.decoder_.readEnum);
  }

  /**
   * Reads a packed varint hash64 field, which consists of a length header and a
   * list of varint hash64s.
   * @return {!Array<string>}
   */
  readPackedVarintHash64(): Array<string> {
    return this.readPackedField_(this.decoder_.readVarintHash64);
  }

  /**
   * Reads a packed fixed hash64 field, which consists of a length header and a
   * list of fixed hash64s.
   * @return {!Array<string>}
   */
  readPackedFixedHash64(): Array<string> {
    return this.readPackedField_(this.decoder_.readFixedHash64);
  }
}
