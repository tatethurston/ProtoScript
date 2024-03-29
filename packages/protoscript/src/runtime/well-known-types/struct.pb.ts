// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// Source: google/protobuf/struct.proto
/* eslint-disable */

import type { ByteSource, PartialDeep } from "protoscript";
import * as protoscript from "protoscript";

//========================================//
//                 Types                  //
//========================================//

/**
 * `NullValue` is a singleton enumeration to represent the null value for the
 * `Value` type union.
 *
 * The JSON representation for `NullValue` is JSON `null`.
 */
export type NullValue = "NULL_VALUE";

/**
 * `Struct` represents a structured data value, consisting of fields
 * which map to dynamically typed values. In some languages, `Struct`
 * might be supported by a native representation. For example, in
 * scripting languages like JS a struct is represented as an
 * object. The details of that representation are described together
 * with the proto support for the language.
 *
 * The JSON representation for `Struct` is JSON object.
 */
export interface Struct {
  /**
   * Unordered map of dynamically typed values.
   */
  fields: Record<string, Struct.Fields["value"] | undefined>;
}

export declare namespace Struct {
  interface Fields {
    key: string;
    value: Value;
  }
}

/**
 * `Value` represents a dynamically typed value which can be either
 * null, a number, a string, a boolean, a recursive struct value, or a
 * list of values. A producer of value is expected to set one of these
 * variants. Absence of any variant indicates an error.
 *
 * The JSON representation for `Value` is JSON value.
 */
export interface Value {
  /**
   * Represents a null value.
   */
  nullValue?: NullValue | null | undefined;
  /**
   * Represents a double value.
   */
  numberValue?: number | null | undefined;
  /**
   * Represents a string value.
   */
  stringValue?: string | null | undefined;
  /**
   * Represents a boolean value.
   */
  boolValue?: boolean | null | undefined;
  /**
   * Represents a structured value.
   */
  structValue?: Struct | null | undefined;
  /**
   * Represents a repeated `Value`.
   */
  listValue?: ListValue | null | undefined;
}

/**
 * `ListValue` is a wrapper around a repeated field of values.
 *
 * The JSON representation for `ListValue` is JSON array.
 */
export interface ListValue {
  /**
   * Repeated field of dynamically typed values.
   */
  values: Value[];
}

//========================================//
//        Protobuf Encode / Decode        //
//========================================//

export const NullValue = {
  /**
   * Null value.
   */
  NULL_VALUE: "NULL_VALUE",
  /**
   * @private
   */
  _fromInt: function (i: number): NullValue {
    switch (i) {
      case 0: {
        return "NULL_VALUE";
      }
      // unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
      default: {
        return i as unknown as NullValue;
      }
    }
  },
  /**
   * @private
   */
  _toInt: function (i: NullValue): number {
    switch (i) {
      case "NULL_VALUE": {
        return 0;
      }
      // unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
      default: {
        return i as unknown as number;
      }
    }
  },
} as const;

export const Struct = {
  /**
   * Serializes Struct to protobuf.
   */
  encode: function (msg: PartialDeep<Struct>): Uint8Array {
    return Struct._writeMessage(
      msg,
      new protoscript.BinaryWriter(),
    ).getResultBuffer();
  },

  /**
   * Deserializes Struct from protobuf.
   */
  decode: function (bytes: ByteSource): Struct {
    return Struct._readMessage(
      Struct.initialize(),
      new protoscript.BinaryReader(bytes),
    );
  },

  /**
   * Initializes Struct with all fields set to their default value.
   */
  initialize: function (msg?: Partial<Struct>): Struct {
    return {
      fields: {},
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<Struct>,
    writer: protoscript.BinaryWriter,
  ): protoscript.BinaryWriter {
    if (msg.fields) {
      writer.writeRepeatedMessage(
        1,
        Object.entries(msg.fields).map(([key, value]) => ({
          key: key as any,
          value: value as any,
        })) as any,
        Struct.Fields._writeMessage,
      );
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (
    msg: Struct,
    reader: protoscript.BinaryReader,
  ): Struct {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          const map = {} as Struct.Fields;
          reader.readMessage(map, Struct.Fields._readMessage);
          msg.fields[map.key.toString()] = map.value;
          break;
        }
        default: {
          reader.skipField();
          break;
        }
      }
    }
    return msg;
  },

  Fields: {
    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<Struct.Fields>,
      writer: protoscript.BinaryWriter,
    ): protoscript.BinaryWriter {
      if (msg.key) {
        writer.writeString(1, msg.key);
      }
      if (msg.value) {
        writer.writeMessage(2, msg.value, Value._writeMessage);
      }
      return writer;
    },

    /**
     * @private
     */
    _readMessage: function (
      msg: Struct.Fields,
      reader: protoscript.BinaryReader,
    ): Struct.Fields {
      while (reader.nextField()) {
        const field = reader.getFieldNumber();
        switch (field) {
          case 1: {
            msg.key = reader.readString();
            break;
          }
          case 2: {
            msg.value = Value.initialize();
            reader.readMessage(msg.value, Value._readMessage);
            break;
          }
          default: {
            reader.skipField();
            break;
          }
        }
      }
      return msg;
    },
  },
};

export const Value = {
  /**
   * Serializes Value to protobuf.
   */
  encode: function (msg: PartialDeep<Value>): Uint8Array {
    return Value._writeMessage(
      msg,
      new protoscript.BinaryWriter(),
    ).getResultBuffer();
  },

  /**
   * Deserializes Value from protobuf.
   */
  decode: function (bytes: ByteSource): Value {
    return Value._readMessage(
      Value.initialize(),
      new protoscript.BinaryReader(bytes),
    );
  },

  /**
   * Initializes Value with all fields set to their default value.
   */
  initialize: function (msg?: Partial<Value>): Value {
    return {
      nullValue: undefined,
      numberValue: undefined,
      stringValue: undefined,
      boolValue: undefined,
      structValue: undefined,
      listValue: undefined,
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<Value>,
    writer: protoscript.BinaryWriter,
  ): protoscript.BinaryWriter {
    if (msg.nullValue != undefined) {
      writer.writeEnum(1, NullValue._toInt(msg.nullValue));
    }
    if (msg.numberValue != undefined) {
      writer.writeDouble(2, msg.numberValue);
    }
    if (msg.stringValue != undefined) {
      writer.writeString(3, msg.stringValue);
    }
    if (msg.boolValue != undefined) {
      writer.writeBool(4, msg.boolValue);
    }
    if (msg.structValue != undefined) {
      writer.writeMessage(5, msg.structValue, Struct._writeMessage);
    }
    if (msg.listValue != undefined) {
      writer.writeMessage(6, msg.listValue, ListValue._writeMessage);
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Value, reader: protoscript.BinaryReader): Value {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          msg.nullValue = NullValue._fromInt(reader.readEnum());
          break;
        }
        case 2: {
          msg.numberValue = reader.readDouble();
          break;
        }
        case 3: {
          msg.stringValue = reader.readString();
          break;
        }
        case 4: {
          msg.boolValue = reader.readBool();
          break;
        }
        case 5: {
          msg.structValue = Struct.initialize();
          reader.readMessage(msg.structValue, Struct._readMessage);
          break;
        }
        case 6: {
          msg.listValue = ListValue.initialize();
          reader.readMessage(msg.listValue, ListValue._readMessage);
          break;
        }
        default: {
          reader.skipField();
          break;
        }
      }
    }
    return msg;
  },
};

export const ListValue = {
  /**
   * Serializes ListValue to protobuf.
   */
  encode: function (msg: PartialDeep<ListValue>): Uint8Array {
    return ListValue._writeMessage(
      msg,
      new protoscript.BinaryWriter(),
    ).getResultBuffer();
  },

  /**
   * Deserializes ListValue from protobuf.
   */
  decode: function (bytes: ByteSource): ListValue {
    return ListValue._readMessage(
      ListValue.initialize(),
      new protoscript.BinaryReader(bytes),
    );
  },

  /**
   * Initializes ListValue with all fields set to their default value.
   */
  initialize: function (msg?: Partial<ListValue>): ListValue {
    return {
      values: [],
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<ListValue>,
    writer: protoscript.BinaryWriter,
  ): protoscript.BinaryWriter {
    if (msg.values?.length) {
      writer.writeRepeatedMessage(1, msg.values as any, Value._writeMessage);
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (
    msg: ListValue,
    reader: protoscript.BinaryReader,
  ): ListValue {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          const m = Value.initialize();
          reader.readMessage(m, Value._readMessage);
          msg.values.push(m);
          break;
        }
        default: {
          reader.skipField();
          break;
        }
      }
    }
    return msg;
  },
};

//========================================//
//          JSON Encode / Decode          //
//========================================//

export const NullValueJSON = {
  /**
   * Null value.
   */
  NULL_VALUE: "NULL_VALUE",
  /**
   * @private
   */
  _fromInt: function (i: number): NullValue {
    switch (i) {
      case 0: {
        return "NULL_VALUE";
      }
      // unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
      default: {
        return i as unknown as NullValue;
      }
    }
  },
  /**
   * @private
   */
  _toInt: function (i: NullValue): number {
    switch (i) {
      case "NULL_VALUE": {
        return 0;
      }
      // unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
      default: {
        return i as unknown as number;
      }
    }
  },
} as const;

export const StructJSON = {
  /**
   * Serializes Struct to JSON.
   */
  encode: function (msg: PartialDeep<Struct>): string {
    return JSON.stringify(StructJSON._writeMessage(msg));
  },

  /**
   * Deserializes Struct from JSON.
   */
  decode: function (json: string): Struct {
    return StructJSON._readMessage(StructJSON.initialize(), JSON.parse(json));
  },

  /**
   * Initializes Struct with all fields set to their default value.
   */
  initialize: function (msg?: Partial<Struct>): Struct {
    return {
      fields: {},
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (msg: PartialDeep<Struct>): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.fields) {
      const _fields_ = Object.fromEntries(
        Object.entries(msg.fields)
          .map(([key, value]) => ({ key: key as any, value: value as any }))
          .map(StructJSON.Fields._writeMessage)
          .map(({ key, value }) => [key, value]),
      );
      if (Object.keys(_fields_).length > 0) {
        json["fields"] = _fields_;
      }
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Struct, json: any): Struct {
    const _fields_ = json["fields"];
    if (_fields_) {
      msg.fields = Object.fromEntries(
        Object.entries(_fields_)
          .map(([key, value]) => ({ key: key as any, value: value as any }))
          .map(StructJSON.Fields._readMessage)
          .map(({ key, value }) => [key, value]),
      );
    }
    return msg;
  },

  Fields: {
    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<Struct.Fields>,
    ): Record<string, unknown> {
      const json: Record<string, unknown> = {};
      if (msg.key) {
        json["key"] = msg.key;
      }
      if (msg.value) {
        const _value_ = ValueJSON._writeMessage(msg.value);
        if (Object.keys(_value_).length > 0) {
          json["value"] = _value_;
        }
      }
      return json;
    },

    /**
     * @private
     */
    _readMessage: function (msg: Struct.Fields, json: any): Struct.Fields {
      const _key_ = json["key"];
      if (_key_) {
        msg.key = _key_;
      }
      const _value_ = json["value"];
      if (_value_) {
        ValueJSON._readMessage(msg.value, _value_);
      }
      return msg;
    },
  },
};

export const ValueJSON = {
  /**
   * Serializes Value to JSON.
   */
  encode: function (msg: PartialDeep<Value>): string {
    return JSON.stringify(ValueJSON._writeMessage(msg));
  },

  /**
   * Deserializes Value from JSON.
   */
  decode: function (json: string): Value {
    return ValueJSON._readMessage(ValueJSON.initialize(), JSON.parse(json));
  },

  /**
   * Initializes Value with all fields set to their default value.
   */
  initialize: function (msg?: Partial<Value>): Value {
    return {
      nullValue: undefined,
      numberValue: undefined,
      stringValue: undefined,
      boolValue: undefined,
      structValue: undefined,
      listValue: undefined,
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (msg: PartialDeep<Value>): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.nullValue != undefined) {
      json["nullValue"] = msg.nullValue;
    }
    if (msg.numberValue != undefined) {
      json["numberValue"] = msg.numberValue;
    }
    if (msg.stringValue != undefined) {
      json["stringValue"] = msg.stringValue;
    }
    if (msg.boolValue != undefined) {
      json["boolValue"] = msg.boolValue;
    }
    if (msg.structValue != undefined) {
      const _structValue_ = StructJSON._writeMessage(msg.structValue);
      json["structValue"] = _structValue_;
    }
    if (msg.listValue != undefined) {
      const _listValue_ = ListValueJSON._writeMessage(msg.listValue);
      json["listValue"] = _listValue_;
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Value, json: any): Value {
    const _nullValue_ = json["nullValue"] ?? json["null_value"];
    if (_nullValue_) {
      msg.nullValue = NullValue._fromInt(_nullValue_);
    }
    const _numberValue_ = json["numberValue"] ?? json["number_value"];
    if (_numberValue_) {
      msg.numberValue = protoscript.parseDouble(_numberValue_);
    }
    const _stringValue_ = json["stringValue"] ?? json["string_value"];
    if (_stringValue_) {
      msg.stringValue = _stringValue_;
    }
    const _boolValue_ = json["boolValue"] ?? json["bool_value"];
    if (_boolValue_) {
      msg.boolValue = _boolValue_;
    }
    const _structValue_ = json["structValue"] ?? json["struct_value"];
    if (_structValue_) {
      msg.structValue = StructJSON.initialize();
      StructJSON._readMessage(msg.structValue, _structValue_);
    }
    const _listValue_ = json["listValue"] ?? json["list_value"];
    if (_listValue_) {
      msg.listValue = ListValueJSON.initialize();
      ListValueJSON._readMessage(msg.listValue, _listValue_);
    }
    return msg;
  },
};

export const ListValueJSON = {
  /**
   * Serializes ListValue to JSON.
   */
  encode: function (msg: PartialDeep<ListValue>): string {
    return JSON.stringify(ListValueJSON._writeMessage(msg));
  },

  /**
   * Deserializes ListValue from JSON.
   */
  decode: function (json: string): ListValue {
    return ListValueJSON._readMessage(
      ListValueJSON.initialize(),
      JSON.parse(json),
    );
  },

  /**
   * Initializes ListValue with all fields set to their default value.
   */
  initialize: function (msg?: Partial<ListValue>): ListValue {
    return {
      values: [],
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<ListValue>,
  ): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.values?.length) {
      json["values"] = msg.values.map(ValueJSON._writeMessage);
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: ListValue, json: any): ListValue {
    const _values_ = json["values"];
    if (_values_) {
      for (const item of _values_) {
        const m = ValueJSON.initialize();
        ValueJSON._readMessage(m, item);
        msg.values.push(m);
      }
    }
    return msg;
  },
};
