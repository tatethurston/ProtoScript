import {
  byteSourceToUint8Array,
  decimalStringToHash64,
  toZigzag64,
} from "./utils";
import { assert, fail } from "./goog/asserts";
import { BinaryEncoder } from "./encoder";
import {
  WireType,
  FieldType,
  TWO_TO_31,
  TWO_TO_32,
  TWO_TO_63,
  TWO_TO_64,
} from "./constants";
import { UInt64, Int64 } from "./arith";

/**
 * BinaryWriter implements encoders for all the wire types specified in
 * https://developers.google.com/protocol-buffers/docs/encoding.
 *
 * @constructor
 * @struct
 */
export const BinaryWriter = function () {
  /**
   * Blocks of serialized data that will be concatenated once all messages have
   * been written.
   * @private {!Array<!Uint8Array|!Array<number>>}
   */
  this.blocks_ = [];

  /**
   * Total number of bytes in the blocks_ array. Does _not_ include bytes in
   * the encoder below.
   * @private {number}
   */
  this.totalLength_ = 0;

  /**
   * Binary encoder holding pieces of a message that we're still serializing.
   * When we get to a stopping point (either the start of a new submessage, or
   * when we need to append a raw Uint8Array), the encoder's buffer will be
   * added to the block array above and the encoder will be reset.
   * @private {!BinaryEncoder}
   */
  this.encoder_ = new BinaryEncoder();
};

/**
 * Append a typed array of bytes onto the buffer.
 *
 * @param {!Uint8Array} arr The byte array to append.
 * @private
 */
BinaryWriter.prototype.appendUint8Array_ = function (arr) {
  const temp = this.encoder_.end();
  this.blocks_.push(temp);
  this.blocks_.push(arr);
  this.totalLength_ += temp.length + arr.length;
};

/**
 * Begins a new message by writing the field header and returning a bookmark
 * which we will use to patch in the message length to in endDelimited_ below.
 * @param {number} field
 * @return {!Array<number>}
 * @private
 */
BinaryWriter.prototype.beginDelimited_ = function (field) {
  this.writeFieldHeader_(field, WireType.DELIMITED);
  const bookmark = this.encoder_.end();
  this.blocks_.push(bookmark);
  this.totalLength_ += bookmark.length;
  bookmark.push(this.totalLength_);
  return bookmark;
};

/**
 * Ends a message by encoding the _change_ in length of the buffer to the
 * parent block and adds the number of bytes needed to encode that length to
 * the total byte length.
 * @param {!Array<number>} bookmark
 * @private
 */
BinaryWriter.prototype.endDelimited_ = function (bookmark) {
  const oldLength = bookmark.pop();
  let messageLength = this.totalLength_ + this.encoder_.length() - oldLength;
  assert(messageLength >= 0);

  while (messageLength > 127) {
    bookmark.push((messageLength & 0x7f) | 0x80);
    messageLength = messageLength >>> 7;
    this.totalLength_++;
  }

  bookmark.push(messageLength);
  this.totalLength_++;
};

/**
 * Writes a pre-serialized message to the buffer.
 * @param {!Uint8Array} bytes The array of bytes to write.
 * @param {number} start The start of the range to write.
 * @param {number} end The end of the range to write.
 */
BinaryWriter.prototype.writeSerializedMessage = function (bytes, start, end) {
  this.appendUint8Array_(bytes.subarray(start, end));
};

/**
 * Writes a pre-serialized message to the buffer if the message and endpoints
 * are non-null.
 * @param {?Uint8Array} bytes The array of bytes to write.
 * @param {?number} start The start of the range to write.
 * @param {?number} end The end of the range to write.
 */
BinaryWriter.prototype.maybeWriteSerializedMessage = function (
  bytes,
  start,
  end
) {
  if (bytes != null && start != null && end != null) {
    this.writeSerializedMessage(bytes, start, end);
  }
};

/**
 * Resets the writer, throwing away any accumulated buffers.
 */
BinaryWriter.prototype.reset = function () {
  this.blocks_ = [];
  this.encoder_.end();
  this.totalLength_ = 0;
};

/**
 * Converts the encoded data into a Uint8Array.
 * @return {!Uint8Array}
 */
BinaryWriter.prototype.getResultBuffer = function () {
  const flat = new Uint8Array(this.totalLength_ + this.encoder_.length());

  const blocks = this.blocks_;
  const blockCount = blocks.length;
  let offset = 0;

  for (let i = 0; i < blockCount; i++) {
    const block = blocks[i];
    flat.set(block, offset);
    offset += block.length;
  }

  const tail = this.encoder_.end();
  flat.set(tail, offset);
  offset += tail.length;

  // Post condition: `flattened` must have had every byte written.
  assert(offset == flat.length);

  // Replace our block list with the flattened block, which lets GC reclaim
  // the temp blocks sooner.
  this.blocks_ = [flat];

  return flat;
};

/**
 * Encodes a (field number, wire type) tuple into a wire-format field header
 * and stores it in the buffer as a varint.
 * @param {number} field The field number.
 * @param {number} wireType The wire-type of the field, as specified in the
 *     protocol buffer documentation.
 * @private
 */
BinaryWriter.prototype.writeFieldHeader_ = function (field, wireType) {
  assert(field >= 1 && field == Math.floor(field));
  const x = field * 8 + wireType;
  this.encoder_.writeUnsignedVarint32(x);
};

/**
 * Writes a field of any valid scalar type to the binary stream.
 * @param {FieldType} fieldType
 * @param {number} field
 * @param {AnyFieldType} value
 */
BinaryWriter.prototype.writeAny = function (fieldType, field, value) {
  switch (fieldType) {
    case FieldType.DOUBLE:
      this.writeDouble(field, /** @type {number} */ value);
      return;
    case FieldType.FLOAT:
      this.writeFloat(field, /** @type {number} */ value);
      return;
    case FieldType.INT64:
      this.writeInt64(field, /** @type {number} */ value);
      return;
    case FieldType.UINT64:
      this.writeUint64(field, /** @type {number} */ value);
      return;
    case FieldType.INT32:
      this.writeInt32(field, /** @type {number} */ value);
      return;
    case FieldType.FIXED64:
      this.writeFixed64(field, /** @type {number} */ value);
      return;
    case FieldType.FIXED32:
      this.writeFixed32(field, /** @type {number} */ value);
      return;
    case FieldType.BOOL:
      this.writeBool(field, /** @type {boolean} */ value);
      return;
    case FieldType.STRING:
      this.writeString(field, /** @type {string} */ value);
      return;
    case FieldType.GROUP:
      fail("Group field type not supported in writeAny()");
      return;
    case FieldType.MESSAGE:
      fail("Message field type not supported in writeAny()");
      return;
    case FieldType.BYTES:
      this.writeBytes(field, /** @type {?Uint8Array} */ value);
      return;
    case FieldType.UINT32:
      this.writeUint32(field, /** @type {number} */ value);
      return;
    case FieldType.ENUM:
      this.writeEnum(field, /** @type {number} */ value);
      return;
    case FieldType.SFIXED32:
      this.writeSfixed32(field, /** @type {number} */ value);
      return;
    case FieldType.SFIXED64:
      this.writeSfixed64(field, /** @type {number} */ value);
      return;
    case FieldType.SINT32:
      this.writeSint32(field, /** @type {number} */ value);
      return;
    case FieldType.SINT64:
      this.writeSint64(field, /** @type {number} */ value);
      return;
    case FieldType.FHASH64:
      this.writeFixedHash64(field, /** @type {string} */ value);
      return;
    case FieldType.VHASH64:
      this.writeVarintHash64(field, /** @type {string} */ value);
      return;
    default:
      fail("Invalid field type in writeAny()");
      return;
  }
};

/**
 * Writes a varint field to the buffer without range checking.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 * @private
 */
BinaryWriter.prototype.writeUnsignedVarint32_ = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeUnsignedVarint32(value);
};

/**
 * Writes a varint field to the buffer without range checking.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 * @private
 */
BinaryWriter.prototype.writeSignedVarint32_ = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeSignedVarint32(value);
};

/**
 * Writes a varint field to the buffer without range checking.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 * @private
 */
BinaryWriter.prototype.writeUnsignedVarint64_ = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeUnsignedVarint64(value);
};

/**
 * Writes a varint field to the buffer without range checking.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 * @private
 */
BinaryWriter.prototype.writeSignedVarint64_ = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeSignedVarint64(value);
};

/**
 * Writes a zigzag varint field to the buffer without range checking.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 * @private
 */
BinaryWriter.prototype.writeZigzagVarint32_ = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeZigzagVarint32(value);
};

/**
 * Writes a zigzag varint field to the buffer without range checking.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 * @private
 */
BinaryWriter.prototype.writeZigzagVarint64_ = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeZigzagVarint64(value);
};

/**
 * Writes a zigzag varint field to the buffer without range checking.
 * @param {number} field The field number.
 * @param {string?} value The value to write.
 * @private
 */
BinaryWriter.prototype.writeZigzagVarint64String_ = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeZigzagVarint64String(value);
};

/**
 * Writes a zigzag varint field to the buffer without range checking.
 * @param {number} field The field number.
 * @param {string?} value The value to write.
 * @private
 */
BinaryWriter.prototype.writeZigzagVarintHash64_ = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeZigzagVarintHash64(value);
};

/**
 * Writes an int32 field to the buffer. Numbers outside the range [-2^31,2^31)
 * will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeInt32 = function (field, value) {
  if (value == null) return;
  assert(value >= -TWO_TO_31 && value < TWO_TO_31);
  this.writeSignedVarint32_(field, value);
};

/**
 * Writes an int32 field represented as a string to the buffer. Numbers outside
 * the range [-2^31,2^31) will be truncated.
 * @param {number} field The field number.
 * @param {string?} value The value to write.
 */
BinaryWriter.prototype.writeInt32String = function (field, value) {
  if (value == null) return;
  const intValue = /** {number} */ parseInt(value, 10);
  assert(intValue >= -TWO_TO_31 && intValue < TWO_TO_31);
  this.writeSignedVarint32_(field, intValue);
};

/**
 * Writes an int64 field to the buffer. Numbers outside the range [-2^63,2^63)
 * will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeInt64 = function (field, value) {
  if (value == null) return;
  assert(value >= -TWO_TO_63 && value < TWO_TO_63);
  this.writeSignedVarint64_(field, value);
};

/**
 * Writes a int64 field (with value as a string) to the buffer.
 * @param {number} field The field number.
 * @param {string?} value The value to write.
 */
BinaryWriter.prototype.writeInt64String = function (field, value) {
  if (value == null) return;
  const num = Int64.fromString(value);
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeSplitVarint64(num.lo, num.hi);
};

/**
 * Writes a uint32 field to the buffer. Numbers outside the range [0,2^32)
 * will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeUint32 = function (field, value) {
  if (value == null) return;
  assert(value >= 0 && value < TWO_TO_32);
  this.writeUnsignedVarint32_(field, value);
};

/**
 * Writes a uint32 field represented as a string to the buffer. Numbers outside
 * the range [0,2^32) will be truncated.
 * @param {number} field The field number.
 * @param {string?} value The value to write.
 */
BinaryWriter.prototype.writeUint32String = function (field, value) {
  if (value == null) return;
  const intValue = /** {number} */ parseInt(value, 10);
  assert(intValue >= 0 && intValue < TWO_TO_32);
  this.writeUnsignedVarint32_(field, intValue);
};

/**
 * Writes a uint64 field to the buffer. Numbers outside the range [0,2^64)
 * will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeUint64 = function (field, value) {
  if (value == null) return;
  assert(value >= 0 && value < TWO_TO_64);
  this.writeUnsignedVarint64_(field, value);
};

/**
 * Writes a uint64 field (with value as a string) to the buffer.
 * @param {number} field The field number.
 * @param {string?} value The value to write.
 */
BinaryWriter.prototype.writeUint64String = function (field, value) {
  if (value == null) return;
  const num = UInt64.fromString(value);
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeSplitVarint64(num.lo, num.hi);
};

/**
 * Writes an sint32 field to the buffer. Numbers outside the range [-2^31,2^31)
 * will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeSint32 = function (field, value) {
  if (value == null) return;
  assert(value >= -TWO_TO_31 && value < TWO_TO_31);
  this.writeZigzagVarint32_(field, value);
};

/**
 * Writes an sint64 field to the buffer. Numbers outside the range [-2^63,2^63)
 * will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeSint64 = function (field, value) {
  if (value == null) return;
  assert(value >= -TWO_TO_63 && value < TWO_TO_63);
  this.writeZigzagVarint64_(field, value);
};

/**
 * Writes an sint64 field to the buffer from a hash64 encoded value. Numbers
 * outside the range [-2^63,2^63) will be truncated.
 * @param {number} field The field number.
 * @param {string?} value The hash64 string to write.
 */
BinaryWriter.prototype.writeSintHash64 = function (field, value) {
  if (value == null) return;
  this.writeZigzagVarintHash64_(field, value);
};

/**
 * Writes an sint64 field to the buffer. Numbers outside the range [-2^63,2^63)
 * will be truncated.
 * @param {number} field The field number.
 * @param {string?} value The decimal string to write.
 */
BinaryWriter.prototype.writeSint64String = function (field, value) {
  if (value == null) return;
  this.writeZigzagVarint64String_(field, value);
};

/**
 * Writes a fixed32 field to the buffer. Numbers outside the range [0,2^32)
 * will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeFixed32 = function (field, value) {
  if (value == null) return;
  assert(value >= 0 && value < TWO_TO_32);
  this.writeFieldHeader_(field, WireType.FIXED32);
  this.encoder_.writeUint32(value);
};

/**
 * Writes a fixed64 field to the buffer. Numbers outside the range [0,2^64)
 * will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeFixed64 = function (field, value) {
  if (value == null) return;
  assert(value >= 0 && value < TWO_TO_64);
  this.writeFieldHeader_(field, WireType.FIXED64);
  this.encoder_.writeUint64(value);
};

/**
 * Writes a fixed64 field (with value as a string) to the buffer.
 * @param {number} field The field number.
 * @param {string?} value The value to write.
 */
BinaryWriter.prototype.writeFixed64String = function (field, value) {
  if (value == null) return;
  const num = UInt64.fromString(value);
  this.writeFieldHeader_(field, WireType.FIXED64);
  this.encoder_.writeSplitFixed64(num.lo, num.hi);
};

/**
 * Writes a sfixed32 field to the buffer. Numbers outside the range
 * [-2^31,2^31) will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeSfixed32 = function (field, value) {
  if (value == null) return;
  assert(value >= -TWO_TO_31 && value < TWO_TO_31);
  this.writeFieldHeader_(field, WireType.FIXED32);
  this.encoder_.writeInt32(value);
};

/**
 * Writes a sfixed64 field to the buffer. Numbers outside the range
 * [-2^63,2^63) will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeSfixed64 = function (field, value) {
  if (value == null) return;
  assert(value >= -TWO_TO_63 && value < TWO_TO_63);
  this.writeFieldHeader_(field, WireType.FIXED64);
  this.encoder_.writeInt64(value);
};

/**
 * Writes a sfixed64 string field to the buffer. Numbers outside the range
 * [-2^63,2^63) will be truncated.
 * @param {number} field The field number.
 * @param {string?} value The value to write.
 */
BinaryWriter.prototype.writeSfixed64String = function (field, value) {
  if (value == null) return;
  const num = Int64.fromString(value);
  this.writeFieldHeader_(field, WireType.FIXED64);
  this.encoder_.writeSplitFixed64(num.lo, num.hi);
};

/**
 * Writes a single-precision floating point field to the buffer. Numbers
 * requiring more than 32 bits of precision will be truncated.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeFloat = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.FIXED32);
  this.encoder_.writeFloat(value);
};

/**
 * Writes a double-precision floating point field to the buffer. As this is the
 * native format used by JavaScript, no precision will be lost.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeDouble = function (field, value) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.FIXED64);
  this.encoder_.writeDouble(value);
};

/**
 * Writes a boolean field to the buffer. We allow numbers as input
 * because the JSPB code generator uses 0/1 instead of true/false to save space
 * in the string representation of the proto.
 * @param {number} field The field number.
 * @param {boolean?|number?} value The value to write.
 */
BinaryWriter.prototype.writeBool = function (field, value) {
  if (value == null) return;
  assert(typeof value === "boolean" || typeof value === "number");
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeBool(value);
};

/**
 * Writes an enum field to the buffer.
 * @param {number} field The field number.
 * @param {number?} value The value to write.
 */
BinaryWriter.prototype.writeEnum = function (field, value) {
  if (value == null) return;
  assert(value >= -TWO_TO_31 && value < TWO_TO_31);
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeSignedVarint32(value);
};

/**
 * Writes a string field to the buffer.
 * @param {number} field The field number.
 * @param {string?} value The string to write.
 */
BinaryWriter.prototype.writeString = function (field, value) {
  if (value == null) return;
  const bookmark = this.beginDelimited_(field);
  this.encoder_.writeString(value);
  this.endDelimited_(bookmark);
};

/**
 * Writes an arbitrary byte field to the buffer. Note - to match the behavior
 * of the C++ implementation, empty byte arrays _are_ serialized.
 * @param {number} field The field number.
 * @param {?ByteSource} value The array of bytes to write.
 */
BinaryWriter.prototype.writeBytes = function (field, value) {
  if (value == null) return;
  const bytes = byteSourceToUint8Array(value);
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(bytes.length);
  this.appendUint8Array_(bytes);
};

/**
 * Writes a message to the buffer.
 * @param {number} field The field number.
 * @param {?MessageType} value The message to write.
 * @param {function(MessageTypeNonNull, !BinaryWriter)} writerCallback
 *     Will be invoked with the value to write and the writer to write it with.
 * @template MessageType
 * Use go/closure-ttl to declare a non-nullable version of MessageType.  Replace
 * the null in blah|null with none.  This is necessary because the compiler will
 * infer MessageType to be nullable if the value parameter is nullable.
 * @template MessageTypeNonNull :=
 *     cond(isUnknown(MessageType), unknown(),
 *       mapunion(MessageType, (X) =>
 *         cond(eq(X, 'null'), none(), X)))
 * =:
 */
BinaryWriter.prototype.writeMessage = function (field, value, writerCallback) {
  if (value == null) return;
  const bookmark = this.beginDelimited_(field);
  writerCallback(value, this);
  this.endDelimited_(bookmark);
};

/**
 * Writes a message set extension to the buffer.
 * @param {number} field The field number for the extension.
 * @param {?MessageType} value The extension message object to write. Note that
 *     message set can only have extensions with type of optional message.
 * @param {function(!MessageTypeNonNull, !BinaryWriter)} writerCallback
 *     Will be invoked with the value to write and the writer to write it with.
 * @template MessageType
 * Use go/closure-ttl to declare a non-nullable version of MessageType.  Replace
 * the null in blah|null with none.  This is necessary because the compiler will
 * infer MessageType to be nullable if the value parameter is nullable.
 * @template MessageTypeNonNull :=
 *     cond(isUnknown(MessageType), unknown(),
 *       mapunion(MessageType, (X) =>
 *         cond(eq(X, 'null'), none(), X)))
 * =:
 */
BinaryWriter.prototype.writeMessageSet = function (
  field,
  value,
  writerCallback
) {
  if (value == null) return;
  // The wire format for a message set is defined by
  // google3/net/proto/message_set.proto
  this.writeFieldHeader_(1, WireType.START_GROUP);
  this.writeFieldHeader_(2, WireType.VARINT);
  this.encoder_.writeSignedVarint32(field);
  const bookmark = this.beginDelimited_(3);
  writerCallback(value, this);
  this.endDelimited_(bookmark);
  this.writeFieldHeader_(1, WireType.END_GROUP);
};

/**
 * Writes a group message to the buffer.
 *
 * @param {number} field The field number.
 * @param {?MessageType} value The message to write, wrapped with START_GROUP /
 *     END_GROUP tags. Will be a no-op if 'value' is null.
 * @param {function(MessageTypeNonNull, !BinaryWriter)} writerCallback
 *     Will be invoked with the value to write and the writer to write it with.
 * @template MessageType
 * Use go/closure-ttl to declare a non-nullable version of MessageType.  Replace
 * the null in blah|null with none.  This is necessary because the compiler will
 * infer MessageType to be nullable if the value parameter is nullable.
 * @template MessageTypeNonNull :=
 *     cond(isUnknown(MessageType), unknown(),
 *       mapunion(MessageType, (X) =>
 *         cond(eq(X, 'null'), none(), X)))
 * =:
 */
BinaryWriter.prototype.writeGroup = function (field, value, writerCallback) {
  if (value == null) return;
  this.writeFieldHeader_(field, WireType.START_GROUP);
  writerCallback(value, this);
  this.writeFieldHeader_(field, WireType.END_GROUP);
};

/**
 * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
 * the buffer.
 * @param {number} field The field number.
 * @param {string?} value The hash string.
 */
BinaryWriter.prototype.writeFixedHash64 = function (field, value) {
  if (value == null) return;
  assert(value.length == 8);
  this.writeFieldHeader_(field, WireType.FIXED64);
  this.encoder_.writeFixedHash64(value);
};

/**
 * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
 * the buffer.
 * @param {number} field The field number.
 * @param {string?} value The hash string.
 */
BinaryWriter.prototype.writeVarintHash64 = function (field, value) {
  if (value == null) return;
  assert(value.length == 8);
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeVarintHash64(value);
};

/**
 * Writes a 64-bit field to the buffer as a fixed64.
 * @param {number} field The field number.
 * @param {number} lowBits The low 32 bits.
 * @param {number} highBits The high 32 bits.
 */
BinaryWriter.prototype.writeSplitFixed64 = function (field, lowBits, highBits) {
  this.writeFieldHeader_(field, WireType.FIXED64);
  this.encoder_.writeSplitFixed64(lowBits, highBits);
};

/**
 * Writes a 64-bit field to the buffer as a varint.
 * @param {number} field The field number.
 * @param {number} lowBits The low 32 bits.
 * @param {number} highBits The high 32 bits.
 */
BinaryWriter.prototype.writeSplitVarint64 = function (
  field,
  lowBits,
  highBits
) {
  this.writeFieldHeader_(field, WireType.VARINT);
  this.encoder_.writeSplitVarint64(lowBits, highBits);
};

/**
 * Writes a 64-bit field to the buffer as a zigzag encoded varint.
 * @param {number} field The field number.
 * @param {number} lowBits The low 32 bits.
 * @param {number} highBits The high 32 bits.
 */
BinaryWriter.prototype.writeSplitZigzagVarint64 = function (
  field,
  lowBits,
  highBits
) {
  this.writeFieldHeader_(field, WireType.VARINT);
  const encoder = this.encoder_;
  toZigzag64(lowBits, highBits, function (lowBits, highBits) {
    encoder.writeSplitVarint64(lowBits >>> 0, highBits >>> 0);
  });
};

/**
 * Writes an array of numbers to the buffer as a repeated 32-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedInt32 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeSignedVarint32_(field, value[i]);
  }
};

/**
 * Writes an array of numbers formatted as strings to the buffer as a repeated
 * 32-bit int field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedInt32String = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeInt32String(field, value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a repeated 64-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedInt64 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeSignedVarint64_(field, value[i]);
  }
};

/**
 * Writes an array of 64-bit values to the buffer as a fixed64.
 * @param {number} field The field number.
 * @param {?Array<T>} value The value.
 * @param {function(T): number} lo Function to get low bits.
 * @param {function(T): number} hi Function to get high bits.
 * @template T
 */
BinaryWriter.prototype.writeRepeatedSplitFixed64 = function (
  field,
  value,
  lo,
  hi
) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeSplitFixed64(field, lo(value[i]), hi(value[i]));
  }
};

/**
 * Writes an array of 64-bit values to the buffer as a varint.
 * @param {number} field The field number.
 * @param {?Array<T>} value The value.
 * @param {function(T): number} lo Function to get low bits.
 * @param {function(T): number} hi Function to get high bits.
 * @template T
 */
BinaryWriter.prototype.writeRepeatedSplitVarint64 = function (
  field,
  value,
  lo,
  hi
) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeSplitVarint64(field, lo(value[i]), hi(value[i]));
  }
};

/**
 * Writes an array of 64-bit values to the buffer as a zigzag varint.
 * @param {number} field The field number.
 * @param {?Array<T>} value The value.
 * @param {function(T): number} lo Function to get low bits.
 * @param {function(T): number} hi Function to get high bits.
 * @template T
 */
BinaryWriter.prototype.writeRepeatedSplitZigzagVarint64 = function (
  field,
  value,
  lo,
  hi
) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeSplitZigzagVarint64(field, lo(value[i]), hi(value[i]));
  }
};

/**
 * Writes an array of numbers formatted as strings to the buffer as a repeated
 * 64-bit int field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedInt64String = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeInt64String(field, value[i]);
  }
};

/**
 * Writes an array numbers to the buffer as a repeated unsigned 32-bit int
 *     field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedUint32 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeUnsignedVarint32_(field, value[i]);
  }
};

/**
 * Writes an array of numbers formatted as strings to the buffer as a repeated
 * unsigned 32-bit int field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedUint32String = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeUint32String(field, value[i]);
  }
};

/**
 * Writes an array numbers to the buffer as a repeated unsigned 64-bit int
 *     field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedUint64 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeUnsignedVarint64_(field, value[i]);
  }
};

/**
 * Writes an array of numbers formatted as strings to the buffer as a repeated
 * unsigned 64-bit int field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedUint64String = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeUint64String(field, value[i]);
  }
};

/**
 * Writes an array numbers to the buffer as a repeated signed 32-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedSint32 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeZigzagVarint32_(field, value[i]);
  }
};

/**
 * Writes an array numbers to the buffer as a repeated signed 64-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedSint64 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeZigzagVarint64_(field, value[i]);
  }
};

/**
 * Writes an array numbers to the buffer as a repeated signed 64-bit int field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedSint64String = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeZigzagVarint64String_(field, value[i]);
  }
};

/**
 * Writes an array of hash64 strings to the buffer as a repeated signed 64-bit
 * int field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedSintHash64 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeZigzagVarintHash64_(field, value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a repeated fixed32 field. This
 * works for both signed and unsigned fixed32s.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedFixed32 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeFixed32(field, value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a repeated fixed64 field. This
 * works for both signed and unsigned fixed64s.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedFixed64 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeFixed64(field, value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a repeated fixed64 field. This
 * works for both signed and unsigned fixed64s.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of decimal strings to write.
 */
BinaryWriter.prototype.writeRepeatedFixed64String = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeFixed64String(field, value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a repeated sfixed32 field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedSfixed32 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeSfixed32(field, value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a repeated sfixed64 field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedSfixed64 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeSfixed64(field, value[i]);
  }
};

/**
 * Writes an array of decimal strings to the buffer as a repeated sfixed64
 * field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of decimal strings to write.
 */
BinaryWriter.prototype.writeRepeatedSfixed64String = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeSfixed64String(field, value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a repeated float field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedFloat = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeFloat(field, value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a repeated double field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedDouble = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeDouble(field, value[i]);
  }
};

/**
 * Writes an array of booleans to the buffer as a repeated bool field.
 * @param {number} field The field number.
 * @param {?Array<boolean>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedBool = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeBool(field, value[i]);
  }
};

/**
 * Writes an array of enums to the buffer as a repeated enum field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writeRepeatedEnum = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeEnum(field, value[i]);
  }
};

/**
 * Writes an array of strings to the buffer as a repeated string field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of strings to write.
 */
BinaryWriter.prototype.writeRepeatedString = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeString(field, value[i]);
  }
};

/**
 * Writes an array of arbitrary byte fields to the buffer.
 * @param {number} field The field number.
 * @param {?Array<!ByteSource>} value The arrays of arrays of bytes to
 *     write.
 */
BinaryWriter.prototype.writeRepeatedBytes = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeBytes(field, value[i]);
  }
};

/**
 * Writes an array of messages to the buffer.
 * @template MessageType
 * @param {number} field The field number.
 * @param {?Array<MessageType>} value The array of messages to
 *    write.
 * @param {function(MessageType, !BinaryWriter)} writerCallback
 *     Will be invoked with the value to write and the writer to write it with.
 */
BinaryWriter.prototype.writeRepeatedMessage = function (
  field,
  value,
  writerCallback
) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    const bookmark = this.beginDelimited_(field);
    writerCallback(value[i], this);
    this.endDelimited_(bookmark);
  }
};

/**
 * Writes an array of group messages to the buffer.
 * @template MessageType
 * @param {number} field The field number.
 * @param {?Array<MessageType>} value The array of messages to
 *    write.
 * @param {function(MessageType, !BinaryWriter)} writerCallback
 *     Will be invoked with the value to write and the writer to write it with.
 */
BinaryWriter.prototype.writeRepeatedGroup = function (
  field,
  value,
  writerCallback
) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeFieldHeader_(field, WireType.START_GROUP);
    writerCallback(value[i], this);
    this.writeFieldHeader_(field, WireType.END_GROUP);
  }
};

/**
 * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
 * the buffer.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of hashes to write.
 */
BinaryWriter.prototype.writeRepeatedFixedHash64 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeFixedHash64(field, value[i]);
  }
};

/**
 * Writes a repeated 64-bit hash string field (8 characters @ 8 bits of data
 * each) to the buffer.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of hashes to write.
 */
BinaryWriter.prototype.writeRepeatedVarintHash64 = function (field, value) {
  if (value == null) return;
  for (let i = 0; i < value.length; i++) {
    this.writeVarintHash64(field, value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a packed 32-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedInt32 = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeSignedVarint32(value[i]);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of numbers represented as strings to the buffer as a packed
 * 32-bit int field.
 * @param {number} field
 * @param {?Array<string>} value
 */
BinaryWriter.prototype.writePackedInt32String = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeSignedVarint32(parseInt(value[i], 10));
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of numbers to the buffer as a packed 64-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedInt64 = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeSignedVarint64(value[i]);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of 64-bit values to the buffer as a fixed64.
 * @param {number} field The field number.
 * @param {?Array<T>} value The value.
 * @param {function(T): number} lo Function to get low bits.
 * @param {function(T): number} hi Function to get high bits.
 * @template T
 */
BinaryWriter.prototype.writePackedSplitFixed64 = function (
  field,
  value,
  lo,
  hi
) {
  if (value == null) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeSplitFixed64(lo(value[i]), hi(value[i]));
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of 64-bit values to the buffer as a varint.
 * @param {number} field The field number.
 * @param {?Array<T>} value The value.
 * @param {function(T): number} lo Function to get low bits.
 * @param {function(T): number} hi Function to get high bits.
 * @template T
 */
BinaryWriter.prototype.writePackedSplitVarint64 = function (
  field,
  value,
  lo,
  hi
) {
  if (value == null) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeSplitVarint64(lo(value[i]), hi(value[i]));
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of 64-bit values to the buffer as a zigzag varint.
 * @param {number} field The field number.
 * @param {?Array<T>} value The value.
 * @param {function(T): number} lo Function to get low bits.
 * @param {function(T): number} hi Function to get high bits.
 * @template T
 */
BinaryWriter.prototype.writePackedSplitZigzagVarint64 = function (
  field,
  value,
  lo,
  hi
) {
  if (value == null) return;
  const bookmark = this.beginDelimited_(field);
  const encoder = this.encoder_;
  for (let i = 0; i < value.length; i++) {
    toZigzag64(lo(value[i]), hi(value[i]), function (bitsLow, bitsHigh) {
      encoder.writeSplitVarint64(bitsLow >>> 0, bitsHigh >>> 0);
    });
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of numbers represented as strings to the buffer as a packed
 * 64-bit int field.
 * @param {number} field
 * @param {?Array<string>} value
 */
BinaryWriter.prototype.writePackedInt64String = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    const num = Int64.fromString(value[i]);
    this.encoder_.writeSplitVarint64(num.lo, num.hi);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array numbers to the buffer as a packed unsigned 32-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedUint32 = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeUnsignedVarint32(value[i]);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of numbers represented as strings to the buffer as a packed
 * unsigned 32-bit int field.
 * @param {number} field
 * @param {?Array<string>} value
 */
BinaryWriter.prototype.writePackedUint32String = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeUnsignedVarint32(parseInt(value[i], 10));
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array numbers to the buffer as a packed unsigned 64-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedUint64 = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeUnsignedVarint64(value[i]);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of numbers represented as strings to the buffer as a packed
 * unsigned 64-bit int field.
 * @param {number} field
 * @param {?Array<string>} value
 */
BinaryWriter.prototype.writePackedUint64String = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    const num = UInt64.fromString(value[i]);
    this.encoder_.writeSplitVarint64(num.lo, num.hi);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array numbers to the buffer as a packed signed 32-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedSint32 = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeZigzagVarint32(value[i]);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of numbers to the buffer as a packed signed 64-bit int field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedSint64 = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeZigzagVarint64(value[i]);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of decimal strings to the buffer as a packed signed 64-bit
 * int field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of decimal strings to write.
 */
BinaryWriter.prototype.writePackedSint64String = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeZigzagVarintHash64(decimalStringToHash64(value[i]));
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of hash 64 strings to the buffer as a packed signed 64-bit
 * int field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of decimal strings to write.
 */
BinaryWriter.prototype.writePackedSintHash64 = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeZigzagVarintHash64(value[i]);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes an array of numbers to the buffer as a packed fixed32 field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedFixed32 = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length * 4);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeUint32(value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a packed fixed64 field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedFixed64 = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length * 8);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeUint64(value[i]);
  }
};

/**
 * Writes an array of numbers represented as strings to the buffer as a packed
 * fixed64 field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of strings to write.
 */
BinaryWriter.prototype.writePackedFixed64String = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length * 8);
  for (let i = 0; i < value.length; i++) {
    const num = UInt64.fromString(value[i]);
    this.encoder_.writeSplitFixed64(num.lo, num.hi);
  }
};

/**
 * Writes an array of numbers to the buffer as a packed sfixed32 field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedSfixed32 = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length * 4);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeInt32(value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a packed sfixed64 field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedSfixed64 = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length * 8);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeInt64(value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a packed sfixed64 field.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of decimal strings to write.
 */
BinaryWriter.prototype.writePackedSfixed64String = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length * 8);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeInt64String(value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a packed float field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedFloat = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length * 4);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeFloat(value[i]);
  }
};

/**
 * Writes an array of numbers to the buffer as a packed double field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedDouble = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length * 8);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeDouble(value[i]);
  }
};

/**
 * Writes an array of booleans to the buffer as a packed bool field.
 * @param {number} field The field number.
 * @param {?Array<boolean>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedBool = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeBool(value[i]);
  }
};

/**
 * Writes an array of enums to the buffer as a packed enum field.
 * @param {number} field The field number.
 * @param {?Array<number>} value The array of ints to write.
 */
BinaryWriter.prototype.writePackedEnum = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeEnum(value[i]);
  }
  this.endDelimited_(bookmark);
};

/**
 * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
 * the buffer.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of hashes to write.
 */
BinaryWriter.prototype.writePackedFixedHash64 = function (field, value) {
  if (value == null || !value.length) return;
  this.writeFieldHeader_(field, WireType.DELIMITED);
  this.encoder_.writeUnsignedVarint32(value.length * 8);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeFixedHash64(value[i]);
  }
};

/**
 * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
 * the buffer.
 * @param {number} field The field number.
 * @param {?Array<string>} value The array of hashes to write.
 */
BinaryWriter.prototype.writePackedVarintHash64 = function (field, value) {
  if (value == null || !value.length) return;
  const bookmark = this.beginDelimited_(field);
  for (let i = 0; i < value.length; i++) {
    this.encoder_.writeVarintHash64(value[i]);
  }
  this.endDelimited_(bookmark);
};
