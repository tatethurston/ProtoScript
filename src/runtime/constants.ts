export const FieldType = {
  INVALID: -1,
  DOUBLE: 1,
  FLOAT: 2,
  INT64: 3,
  UINT64: 4,
  INT32: 5,
  FIXED64: 6,
  FIXED32: 7,
  BOOL: 8,
  STRING: 9,
  GROUP: 10,
  MESSAGE: 11,
  BYTES: 12,
  UINT32: 13,
  ENUM: 14,
  SFIXED32: 15,
  SFIXED64: 16,
  SINT32: 17,
  SINT64: 18,

  // Extended types for Javascript
  FHASH64: 30, // 64-bit hash string, fixed-length encoding.
  VHASH64: 31, // 64-bit hash string, varint encoding.
};

export type FieldType = typeof FieldType[keyof typeof FieldType];

/**
 * Wire-format type codes, taken from proto2/public/wire_format_lite.h.
 */
export const WireType = {
  INVALID: -1,
  VARINT: 0,
  FIXED64: 1,
  DELIMITED: 2,
  START_GROUP: 3,
  END_GROUP: 4,
  FIXED32: 5,
};

export type WireType = typeof WireType[keyof typeof WireType];

/**
 * Translates field type to wire type.
 */
export const FieldTypeToWireType = function (fieldType: FieldType): WireType {
  switch (fieldType) {
    case FieldType.INT32:
    case FieldType.INT64:
    case FieldType.UINT32:
    case FieldType.UINT64:
    case FieldType.SINT32:
    case FieldType.SINT64:
    case FieldType.BOOL:
    case FieldType.ENUM:
    case FieldType.VHASH64:
      return WireType.VARINT;
    case FieldType.DOUBLE:
    case FieldType.FIXED64:
    case FieldType.SFIXED64:
    case FieldType.FHASH64:
      return WireType.FIXED64;
    case FieldType.STRING:
    case FieldType.MESSAGE:
    case FieldType.BYTES:
      return WireType.DELIMITED;
    case FieldType.FLOAT:
    case FieldType.FIXED32:
    case FieldType.SFIXED32:
      return WireType.FIXED32;
    case FieldType.INVALID:
    case FieldType.GROUP:
    default:
      return WireType.INVALID;
  }
};

/**
 * Flag to indicate a missing field.
 */
export const INVALID_FIELD_NUMBER = -1;

/**
 * The smallest normal float64 value.
 */
export const FLOAT32_MIN = 1.1754943508222875e-38;

/**
 * The largest finite float32 value.
 */
export const FLOAT32_MAX = 3.4028234663852886e38;

/**
 * The smallest normal float64 value.
 */
export const FLOAT64_MIN = 2.2250738585072014e-308;

/**
 * The largest finite float64 value.
 */
export const FLOAT64_MAX = 1.7976931348623157e308;

/**
 * Convenience constant equal to 2^20.
 */
export const TWO_TO_20 = 1048576;

/**
 * Convenience constant equal to 2^23.
 */
export const TWO_TO_23 = 8388608;

/**
 * Convenience constant equal to 2^31.
 */
export const TWO_TO_31 = 2147483648;

/**
 * Convenience constant equal to 2^32.
 */
export const TWO_TO_32 = 4294967296;

/**
 * Convenience constant equal to 2^52.
 */
export const TWO_TO_52 = 4503599627370496;

/**
 * Convenience constant equal to 2^63.
 */
export const TWO_TO_63 = 9223372036854775808;

/**
 * Convenience constant equal to 2^64.
 */
export const TWO_TO_64 = 18446744073709551616;
