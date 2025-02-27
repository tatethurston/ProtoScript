/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ByteSource,
  byteSourceToUint8Array,
  decimalStringToHash64,
  toZigzag64,
} from "./utils.js";
import { assert, fail } from "./goog/asserts.js";
import { BinaryEncoder } from "./encoder.js";
import {
  WireType,
  FieldType,
  TWO_TO_31,
  TWO_TO_32,
  TWO_TO_63,
  TWO_TO_64,
} from "./constants.js";
import { UInt64, Int64 } from "./arith.js";

/**
 * BinaryWriter implements encoders for all the wire types specified in
 * https://developers.google.com/protocol-buffers/docs/encoding.
 */
export class BinaryWriter {
  blocks_: Array<Uint8Array | number[]>;
  totalLength_: number;
  encoder_: BinaryEncoder;
  constructor() {
    /**
     * Blocks of serialized data that will be concatenated once all messages have
     * been written.
     */
    this.blocks_ = [];

    /**
     * Total number of bytes in the blocks_ array. Does _not_ include bytes in
     * the encoder below.
     */
    this.totalLength_ = 0;

    /**
     * Binary encoder holding pieces of a message that we're still serializing.
     * When we get to a stopping point (either the start of a new submessage, or
     * when we need to append a raw Uint8Array), the encoder's buffer will be
     * added to the block array above and the encoder will be reset.
     */
    this.encoder_ = new BinaryEncoder();
  }

  /**
   * Append a typed array of bytes onto the buffer.
   */
  appendUint8Array_(arr: Uint8Array) {
    const temp = this.encoder_.end();
    this.blocks_.push(temp);
    this.blocks_.push(arr);
    this.totalLength_ += temp.length + arr.length;
  }

  /**
   * Begins a new message by writing the field header and returning a bookmark
   * which we will use to patch in the message length to in endDelimited_ below.
   */
  beginDelimited_(field: number): Array<number> {
    this.writeFieldHeader_(field, WireType.DELIMITED);
    const bookmark = this.encoder_.end();
    this.blocks_.push(bookmark);
    this.totalLength_ += bookmark.length;
    bookmark.push(this.totalLength_);
    return bookmark;
  }

  /**
   * Ends a message by encoding the _change_ in length of the buffer to the
   * parent block and adds the number of bytes needed to encode that length to
   * the total byte length.
   */
  endDelimited_(bookmark: Array<number>) {
    const oldLength = bookmark.pop() ?? 0;
    let messageLength = this.totalLength_ + this.encoder_.length() - oldLength;
    assert(messageLength >= 0);

    while (messageLength > 127) {
      bookmark.push((messageLength & 0x7f) | 0x80);
      messageLength = messageLength >>> 7;
      this.totalLength_++;
    }

    bookmark.push(messageLength);
    this.totalLength_++;
  }

  /**
   * Writes a pre-serialized message to the buffer.
   */
  writeSerializedMessage(bytes: Uint8Array, start: number, end: number) {
    this.appendUint8Array_(bytes.subarray(start, end));
  }

  /**
   * Writes a pre-serialized message to the buffer if the message and endpoints
   * are non-null.
   */
  maybeWriteSerializedMessage(
    bytes: Uint8Array | null,
    start: number | null,
    end: number | null,
  ) {
    if (bytes != null && start != null && end != null) {
      this.writeSerializedMessage(bytes, start, end);
    }
  }

  /**
   * Resets the writer, throwing away any accumulated buffers.
   */
  reset() {
    this.blocks_ = [];
    this.encoder_.end();
    this.totalLength_ = 0;
  }

  /**
   * Converts the encoded data into a Uint8Array.
   */
  getResultBuffer(): Uint8Array {
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
  }

  /**
   * Encodes a (field number, wire type) tuple into a wire-format field header
   * and stores it in the buffer as a varint.
   */
  writeFieldHeader_(field: number, wireType: number) {
    assert(field >= 1 && field == Math.floor(field));
    const x = field * 8 + wireType;
    this.encoder_.writeUnsignedVarint32(x);
  }

  /**
   * Writes a field of any valid scalar type to the binary stream.
   */
  writeAny(fieldType: FieldType, field: number, value: any): void {
    switch (fieldType) {
      case FieldType.DOUBLE:
        this.writeDouble(field, value);
        return;
      case FieldType.FLOAT:
        this.writeFloat(field, value);
        return;
      case FieldType.INT64:
        this.writeInt64(field, value);
        return;
      case FieldType.UINT64:
        this.writeUint64(field, value);
        return;
      case FieldType.INT32:
        this.writeInt32(field, value);
        return;
      case FieldType.FIXED64:
        this.writeFixed64(field, value);
        return;
      case FieldType.FIXED32:
        this.writeFixed32(field, value);
        return;
      case FieldType.BOOL:
        this.writeBool(field, value);
        return;
      case FieldType.STRING:
        this.writeString(field, value);
        return;
      case FieldType.GROUP:
        fail("Group field type not supported in writeAny()");
        return;
      case FieldType.MESSAGE:
        fail("Message field type not supported in writeAny()");
        return;
      case FieldType.BYTES:
        this.writeBytes(field, value);
        return;
      case FieldType.UINT32:
        this.writeUint32(field, value);
        return;
      case FieldType.ENUM:
        this.writeEnum(field, value);
        return;
      case FieldType.SFIXED32:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.writeSfixed32(field, value);
        return;
      case FieldType.SFIXED64:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.writeSfixed64(field, value);
        return;
      case FieldType.SINT32:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.writeSint32(field, value);
        return;
      case FieldType.SINT64:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.writeSint64(field, value);
        return;
      case FieldType.FHASH64:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.writeFixedHash64(field, value);
        return;
      case FieldType.VHASH64:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.writeVarintHash64(field, value);
        return;
      default:
        fail("Invalid field type in writeAny()");
        return;
    }
  }

  /**
   * Writes a varint field to the buffer without range checking.
   */
  writeUnsignedVarint32_(field: number, value: number | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeUnsignedVarint32(value);
  }

  /**
   * Writes a varint field to the buffer without range checking.
   */
  writeSignedVarint32_(field: number, value: number | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeSignedVarint32(value);
  }

  /**
   * Writes a varint field to the buffer without range checking.
   */
  writeUnsignedVarint64_(field: number, value: number | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeUnsignedVarint64(value);
  }

  /**
   * Writes a varint field to the buffer without range checking.
   */
  writeSignedVarint64_(field: number, value: number | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeSignedVarint64(value);
  }

  /**
   * Writes a zigzag varint field to the buffer without range checking.
   */
  writeZigzagVarint32_(field: number, value: number | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeZigzagVarint32(value);
  }

  /**
   * Writes a zigzag varint field to the buffer without range checking.
   */
  writeZigzagVarint64_(field: number, value: number | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeZigzagVarint64(value);
  }

  /**
   * Writes a zigzag varint field to the buffer without range checking.
   */
  writeZigzagVarint64String_(field: number, value: string | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeZigzagVarint64String(value);
  }

  /**
   * Writes a zigzag varint field to the buffer without range checking.
   */
  writeZigzagVarintHash64_(field: number, value: string | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeZigzagVarintHash64(value);
  }

  /**
   * Writes an int32 field to the buffer. Numbers outside the range [-2^31,2^31)
   * will be truncated.
   */
  writeInt32(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= -TWO_TO_31 && value < TWO_TO_31);
    this.writeSignedVarint32_(field, value);
  }

  /**
   * Writes an int32 field represented as a string to the buffer. Numbers outside
   * the range [-2^31,2^31) will be truncated.
   */
  writeInt32String(field: number, value: string | null) {
    if (value == null) return;
    const intValue = /** {number} */ parseInt(value, 10);
    assert(intValue >= -TWO_TO_31 && intValue < TWO_TO_31);
    this.writeSignedVarint32_(field, intValue);
  }

  /**
   * Writes an int64 field to the buffer. Numbers outside the range [-2^63,2^63)
   * will be truncated.
   */
  writeInt64(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= -TWO_TO_63 && value < TWO_TO_63);
    this.writeSignedVarint64_(field, value);
  }

  /**
   * Writes a int64 field (with value as a string) to the buffer.
   */
  writeInt64String(field: number, value: string | null) {
    if (value == null) return;
    const num = Int64.fromString(value);
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeSplitVarint64(num.lo, num.hi);
  }

  /**
   * Writes a uint32 field to the buffer. Numbers outside the range [0,2^32)
   * will be truncated.
   */
  writeUint32(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= 0 && value < TWO_TO_32);
    this.writeUnsignedVarint32_(field, value);
  }

  /**
   * Writes a uint32 field represented as a string to the buffer. Numbers outside
   * the range [0,2^32) will be truncated.
   */
  writeUint32String(field: number, value: string | null) {
    if (value == null) return;
    const intValue = /** {number} */ parseInt(value, 10);
    assert(intValue >= 0 && intValue < TWO_TO_32);
    this.writeUnsignedVarint32_(field, intValue);
  }

  /**
   * Writes a uint64 field to the buffer. Numbers outside the range [0,2^64)
   * will be truncated.
   */
  writeUint64(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= 0 && value < TWO_TO_64);
    this.writeUnsignedVarint64_(field, value);
  }

  /**
   * Writes a uint64 field (with value as a string) to the buffer.
   */
  writeUint64String(field: number, value: string | null) {
    if (value == null) return;
    const num = UInt64.fromString(value);
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeSplitVarint64(num.lo, num.hi);
  }

  /**
   * Writes an sint32 field to the buffer. Numbers outside the range [-2^31,2^31)
   * will be truncated.
   */
  writeSint32(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= -TWO_TO_31 && value < TWO_TO_31);
    this.writeZigzagVarint32_(field, value);
  }

  /**
   * Writes an sint64 field to the buffer. Numbers outside the range [-2^63,2^63)
   * will be truncated.
   */
  writeSint64(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= -TWO_TO_63 && value < TWO_TO_63);
    this.writeZigzagVarint64_(field, value);
  }

  /**
   * Writes an sint64 field to the buffer from a hash64 encoded value. Numbers
   * outside the range [-2^63,2^63) will be truncated.
   */
  writeSintHash64(field: number, value: string | null) {
    if (value == null) return;
    this.writeZigzagVarintHash64_(field, value);
  }

  /**
   * Writes an sint64 field to the buffer. Numbers outside the range [-2^63,2^63)
   * will be truncated.
   */
  writeSint64String(field: number, value: string | null) {
    if (value == null) return;
    this.writeZigzagVarint64String_(field, value);
  }

  /**
   * Writes a fixed32 field to the buffer. Numbers outside the range [0,2^32)
   * will be truncated.
   */
  writeFixed32(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= 0 && value < TWO_TO_32);
    this.writeFieldHeader_(field, WireType.FIXED32);
    this.encoder_.writeUint32(value);
  }

  /**
   * Writes a fixed64 field to the buffer. Numbers outside the range [0,2^64)
   * will be truncated.
   */
  writeFixed64(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= 0 && value < TWO_TO_64);
    this.writeFieldHeader_(field, WireType.FIXED64);
    this.encoder_.writeUint64(value);
  }

  /**
   * Writes a fixed64 field (with value as a string) to the buffer.
   */
  writeFixed64String(field: number, value: string | null) {
    if (value == null) return;
    const num = UInt64.fromString(value);
    this.writeFieldHeader_(field, WireType.FIXED64);
    this.encoder_.writeSplitFixed64(num.lo, num.hi);
  }

  /**
   * Writes a sfixed32 field to the buffer. Numbers outside the range
   * [-2^31,2^31) will be truncated.
   */
  writeSfixed32(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= -TWO_TO_31 && value < TWO_TO_31);
    this.writeFieldHeader_(field, WireType.FIXED32);
    this.encoder_.writeInt32(value);
  }

  /**
   * Writes a sfixed64 field to the buffer. Numbers outside the range
   * [-2^63,2^63) will be truncated.
   */
  writeSfixed64(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= -TWO_TO_63 && value < TWO_TO_63);
    this.writeFieldHeader_(field, WireType.FIXED64);
    this.encoder_.writeInt64(value);
  }

  /**
   * Writes a sfixed64 string field to the buffer. Numbers outside the range
   * [-2^63,2^63) will be truncated.
   */
  writeSfixed64String(field: number, value: string | null) {
    if (value == null) return;
    const num = Int64.fromString(value);
    this.writeFieldHeader_(field, WireType.FIXED64);
    this.encoder_.writeSplitFixed64(num.lo, num.hi);
  }

  /**
   * Writes a single-precision floating point field to the buffer. Numbers
   * requiring more than 32 bits of precision will be truncated.
   */
  writeFloat(field: number, value: number | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.FIXED32);
    this.encoder_.writeFloat(value);
  }

  /**
   * Writes a double-precision floating point field to the buffer. As this is the
   * native format used by JavaScript, no precision will be lost.
   */
  writeDouble(field: number, value: number | null) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.FIXED64);
    this.encoder_.writeDouble(value);
  }

  /**
   * Writes a boolean field to the buffer. We allow numbers as input
   * because the JSPB code generator uses 0/1 instead of true/false to save space
   * in the string representation of the proto.
   */
  writeBool(field: number, value: boolean | number | undefined) {
    if (value == null) return;
    assert(typeof value === "boolean" || typeof value === "number");
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeBool(value);
  }

  /**
   * Writes an enum field to the buffer.
   */
  writeEnum(field: number, value: number | null) {
    if (value == null) return;
    assert(value >= -TWO_TO_31 && value < TWO_TO_31);
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeSignedVarint32(value);
  }

  /**
   * Writes a string field to the buffer.
   */
  writeString(field: number, value: string | null) {
    if (value == null) return;
    const bookmark = this.beginDelimited_(field);
    this.encoder_.writeString(value);
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an arbitrary byte field to the buffer. Note - to match the behavior
   * of the C++ implementation, empty byte arrays _are_ serialized.
   */
  writeBytes(field: number, value: ByteSource | null) {
    if (value == null) return;
    const bytes = byteSourceToUint8Array(value);
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(bytes.length);
    this.appendUint8Array_(bytes);
  }

  /**
   * Writes a message to the buffer.
   */
  writeMessage<MessageType>(
    field: number,
    value: MessageType | null,
    writerCallback: (arg0: MessageType, arg1: BinaryWriter) => void,
  ) {
    if (value == null) return;
    const bookmark = this.beginDelimited_(field);
    writerCallback(value, this);
    this.endDelimited_(bookmark);
  }

  /**
   * Writes a message set extension to the buffer.
   */
  writeMessageSet<MessageType>(
    field: number,
    value: MessageType | null,
    writerCallback: (arg0: MessageType, arg1: BinaryWriter) => void,
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
  }

  /**
   * Writes a group message to the buffer.
   */
  writeGroup<MessageType>(
    field: number,
    value: MessageType | null,
    writerCallback: (arg0: MessageType, arg1: BinaryWriter) => void,
  ) {
    if (value == null) return;
    this.writeFieldHeader_(field, WireType.START_GROUP);
    writerCallback(value, this);
    this.writeFieldHeader_(field, WireType.END_GROUP);
  }

  /**
   * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
   * the buffer.
   */
  writeFixedHash64(field: number, value: string | null) {
    if (value == null) return;
    assert(value.length == 8);
    this.writeFieldHeader_(field, WireType.FIXED64);
    this.encoder_.writeFixedHash64(value);
  }

  /**
   * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
   * the buffer.
   */
  writeVarintHash64(field: number, value: string | null) {
    if (value == null) return;
    assert(value.length == 8);
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeVarintHash64(value);
  }

  /**
   * Writes a 64-bit field to the buffer as a fixed64.
   */
  writeSplitFixed64(field: number, lowBits: number, highBits: number) {
    this.writeFieldHeader_(field, WireType.FIXED64);
    this.encoder_.writeSplitFixed64(lowBits, highBits);
  }

  /**
   * Writes a 64-bit field to the buffer as a varint.
   */
  writeSplitVarint64(field: number, lowBits: number, highBits: number) {
    this.writeFieldHeader_(field, WireType.VARINT);
    this.encoder_.writeSplitVarint64(lowBits, highBits);
  }

  /**
   * Writes a 64-bit field to the buffer as a zigzag encoded varint.
   */
  writeSplitZigzagVarint64(field: number, lowBits: number, highBits: number) {
    this.writeFieldHeader_(field, WireType.VARINT);
    const encoder = this.encoder_;
    toZigzag64(lowBits, highBits, function (lowBits, highBits) {
      encoder.writeSplitVarint64(lowBits >>> 0, highBits >>> 0);
    });
  }

  /**
   * Writes an array of numbers to the buffer as a repeated 32-bit int field.
   */
  writeRepeatedInt32(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeSignedVarint32_(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers formatted as strings to the buffer as a repeated
   * 32-bit int field.
   */
  writeRepeatedInt32String(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeInt32String(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a repeated 64-bit int field.
   */
  writeRepeatedInt64(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeSignedVarint64_(field, value[i]);
    }
  }

  /**
   * Writes an array of 64-bit values to the buffer as a fixed64.
   */
  writeRepeatedSplitFixed64<T>(
    field: number,
    value: Array<T> | null,
    lo: (arg0: T) => number,
    hi: (arg0: T) => number,
  ) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeSplitFixed64(field, lo(value[i]), hi(value[i]));
    }
  }

  /**
   * Writes an array of 64-bit values to the buffer as a varint.
   */
  writeRepeatedSplitVarint64<T>(
    field: number,
    value: Array<T> | null,
    lo: (arg0: T) => number,
    hi: (arg0: T) => number,
  ) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeSplitVarint64(field, lo(value[i]), hi(value[i]));
    }
  }

  /**
   * Writes an array of 64-bit values to the buffer as a zigzag varint.
   */
  writeRepeatedSplitZigzagVarint64<T>(
    field: number,
    value: Array<T> | null,
    lo: (arg0: T) => number,
    hi: (arg0: T) => number,
  ) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeSplitZigzagVarint64(field, lo(value[i]), hi(value[i]));
    }
  }

  /**
   * Writes an array of numbers formatted as strings to the buffer as a repeated
   * 64-bit int field.
   */
  writeRepeatedInt64String(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeInt64String(field, value[i]);
    }
  }

  /**
   * Writes an array numbers to the buffer as a repeated unsigned 32-bit int
   *     field.
   */
  writeRepeatedUint32(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeUnsignedVarint32_(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers formatted as strings to the buffer as a repeated
   * unsigned 32-bit int field.
   */
  writeRepeatedUint32String(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeUint32String(field, value[i]);
    }
  }

  /**
   * Writes an array numbers to the buffer as a repeated unsigned 64-bit int
   *     field.
   */
  writeRepeatedUint64(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeUnsignedVarint64_(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers formatted as strings to the buffer as a repeated
   * unsigned 64-bit int field.
   */
  writeRepeatedUint64String(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeUint64String(field, value[i]);
    }
  }

  /**
   * Writes an array numbers to the buffer as a repeated signed 32-bit int field.
   */
  writeRepeatedSint32(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeZigzagVarint32_(field, value[i]);
    }
  }

  /**
   * Writes an array numbers to the buffer as a repeated signed 64-bit int field.
   */
  writeRepeatedSint64(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeZigzagVarint64_(field, value[i]);
    }
  }

  /**
   * Writes an array numbers to the buffer as a repeated signed 64-bit int field.
   */
  writeRepeatedSint64String(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeZigzagVarint64String_(field, value[i]);
    }
  }

  /**
   * Writes an array of hash64 strings to the buffer as a repeated signed 64-bit
   * int field.
   */
  writeRepeatedSintHash64(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeZigzagVarintHash64_(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a repeated fixed32 field. This
   * works for both signed and unsigned fixed32s.
   */
  writeRepeatedFixed32(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeFixed32(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a repeated fixed64 field. This
   * works for both signed and unsigned fixed64s.
   */
  writeRepeatedFixed64(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeFixed64(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a repeated fixed64 field. This
   * works for both signed and unsigned fixed64s.
   */
  writeRepeatedFixed64String(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeFixed64String(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a repeated sfixed32 field.
   */
  writeRepeatedSfixed32(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeSfixed32(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a repeated sfixed64 field.
   */
  writeRepeatedSfixed64(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeSfixed64(field, value[i]);
    }
  }

  /**
   * Writes an array of decimal strings to the buffer as a repeated sfixed64
   * field.
   */
  writeRepeatedSfixed64String(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeSfixed64String(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a repeated float field.
   */
  writeRepeatedFloat(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeFloat(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a repeated double field.
   */
  writeRepeatedDouble(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeDouble(field, value[i]);
    }
  }

  /**
   * Writes an array of booleans to the buffer as a repeated bool field.
   */
  writeRepeatedBool(field: number, value: Array<boolean> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeBool(field, value[i]);
    }
  }

  /**
   * Writes an array of enums to the buffer as a repeated enum field.
   */
  writeRepeatedEnum(field: number, value: Array<number> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeEnum(field, value[i]);
    }
  }

  /**
   * Writes an array of strings to the buffer as a repeated string field.
   */
  writeRepeatedString(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeString(field, value[i]);
    }
  }

  /**
   * Writes an array of arbitrary byte fields to the buffer.
   */
  writeRepeatedBytes(field: number, value: Array<ByteSource> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeBytes(field, value[i]);
    }
  }

  /**
   * Writes an array of messages to the buffer.
   */
  writeRepeatedMessage<MessageType>(
    field: number,
    value: Array<MessageType> | null,
    writerCallback: (arg0: MessageType, arg1: BinaryWriter) => any,
  ) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      const bookmark = this.beginDelimited_(field);
      writerCallback(value[i], this);
      this.endDelimited_(bookmark);
    }
  }

  /**
   * Writes an array of group messages to the buffer.
   * @template MessageType
   */
  writeRepeatedGroup<MessageType>(
    field: number,
    value: Array<MessageType> | null,
    writerCallback: (arg0: MessageType, arg1: BinaryWriter) => any,
  ) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeFieldHeader_(field, WireType.START_GROUP);
      writerCallback(value[i], this);
      this.writeFieldHeader_(field, WireType.END_GROUP);
    }
  }

  /**
   * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
   * the buffer.
   */
  writeRepeatedFixedHash64(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeFixedHash64(field, value[i]);
    }
  }

  /**
   * Writes a repeated 64-bit hash string field (8 characters @ 8 bits of data
   * each) to the buffer.
   */
  writeRepeatedVarintHash64(field: number, value: Array<string> | null) {
    if (value == null) return;
    for (let i = 0; i < value.length; i++) {
      this.writeVarintHash64(field, value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a packed 32-bit int field.
   */
  writePackedInt32(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeSignedVarint32(value[i]);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of numbers represented as strings to the buffer as a packed
   * 32-bit int field.
   */
  writePackedInt32String(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeSignedVarint32(parseInt(value[i], 10));
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of numbers to the buffer as a packed 64-bit int field.
   */
  writePackedInt64(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeSignedVarint64(value[i]);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of 64-bit values to the buffer as a fixed64.
   */
  writePackedSplitFixed64<T>(
    field: number,
    value: Array<T> | null,
    lo: (arg0: T) => number,
    hi: (arg0: T) => number,
  ) {
    if (value == null) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeSplitFixed64(lo(value[i]), hi(value[i]));
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of 64-bit values to the buffer as a varint.
   */
  writePackedSplitVarint64<T>(
    field: number,
    value: Array<T> | null,
    lo: (arg0: T) => number,
    hi: (arg0: T) => number,
  ) {
    if (value == null) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeSplitVarint64(lo(value[i]), hi(value[i]));
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of 64-bit values to the buffer as a zigzag varint.
   */
  writePackedSplitZigzagVarint64<T>(
    field: number,
    value: Array<T> | null,
    lo: (arg0: T) => number,
    hi: (arg0: T) => number,
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
  }

  /**
   * Writes an array of numbers represented as strings to the buffer as a packed
   * 64-bit int field.
   */
  writePackedInt64String(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      const num = Int64.fromString(value[i]);
      this.encoder_.writeSplitVarint64(num.lo, num.hi);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array numbers to the buffer as a packed unsigned 32-bit int field.
   */
  writePackedUint32(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeUnsignedVarint32(value[i]);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of numbers represented as strings to the buffer as a packed
   * unsigned 32-bit int field.
   */
  writePackedUint32String(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeUnsignedVarint32(parseInt(value[i], 10));
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array numbers to the buffer as a packed unsigned 64-bit int field.
   */
  writePackedUint64(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeUnsignedVarint64(value[i]);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of numbers represented as strings to the buffer as a packed
   * unsigned 64-bit int field.
   */
  writePackedUint64String(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      const num = UInt64.fromString(value[i]);
      this.encoder_.writeSplitVarint64(num.lo, num.hi);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array numbers to the buffer as a packed signed 32-bit int field.
   */
  writePackedSint32(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeZigzagVarint32(value[i]);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of numbers to the buffer as a packed signed 64-bit int field.
   */
  writePackedSint64(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeZigzagVarint64(value[i]);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of decimal strings to the buffer as a packed signed 64-bit
   * int field.
   */
  writePackedSint64String(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeZigzagVarintHash64(decimalStringToHash64(value[i]));
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of hash 64 strings to the buffer as a packed signed 64-bit
   * int field.
   */
  writePackedSintHash64(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeZigzagVarintHash64(value[i]);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes an array of numbers to the buffer as a packed fixed32 field.
   */
  writePackedFixed32(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length * 4);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeUint32(value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a packed fixed64 field.
   */
  writePackedFixed64(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length * 8);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeUint64(value[i]);
    }
  }

  /**
   * Writes an array of numbers represented as strings to the buffer as a packed
   * fixed64 field.
   */
  writePackedFixed64String(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length * 8);
    for (let i = 0; i < value.length; i++) {
      const num = UInt64.fromString(value[i]);
      this.encoder_.writeSplitFixed64(num.lo, num.hi);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a packed sfixed32 field.
   */
  writePackedSfixed32(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length * 4);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeInt32(value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a packed sfixed64 field.
   */
  writePackedSfixed64(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length * 8);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeInt64(value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a packed sfixed64 field.
   */
  writePackedSfixed64String(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length * 8);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeInt64String(value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a packed float field.
   */
  writePackedFloat(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length * 4);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeFloat(value[i]);
    }
  }

  /**
   * Writes an array of numbers to the buffer as a packed double field.
   */
  writePackedDouble(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length * 8);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeDouble(value[i]);
    }
  }

  /**
   * Writes an array of booleans to the buffer as a packed bool field.
   */
  writePackedBool(field: number, value: Array<boolean> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeBool(value[i]);
    }
  }

  /**
   * Writes an array of enums to the buffer as a packed enum field.
   */
  writePackedEnum(field: number, value: Array<number> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeEnum(value[i]);
    }
    this.endDelimited_(bookmark);
  }

  /**
   * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
   * the buffer.
   */
  writePackedFixedHash64(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    this.writeFieldHeader_(field, WireType.DELIMITED);
    this.encoder_.writeUnsignedVarint32(value.length * 8);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeFixedHash64(value[i]);
    }
  }

  /**
   * Writes a 64-bit hash string field (8 characters @ 8 bits of data each) to
   * the buffer.
   */
  writePackedVarintHash64(field: number, value: Array<string> | null) {
    if (!value?.length) return;
    const bookmark = this.beginDelimited_(field);
    for (let i = 0; i < value.length; i++) {
      this.encoder_.writeVarintHash64(value[i]);
    }
    this.endDelimited_(bookmark);
  }
}
