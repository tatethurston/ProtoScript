// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// Source: treeshaking.proto
/* eslint-disable */

import type { ByteSource, PartialDeep } from "protoscript";
import * as protoscript from "protoscript";

//========================================//
//                 Types                  //
//========================================//

export interface TreeshakingTest {
  stringField: string;
  repeatedStringField: string[];
  boolField: boolean;
  repeatedMessageField: NestedMessage[];
  optionalMessageField?: NestedMessage | null | undefined;
  timestampField: protoscript.Timestamp;
  mapField: Record<string, TreeshakingTest.MapField["value"] | undefined>;
}

export declare namespace TreeshakingTest {
  interface MapField {
    key: string;
    value: string;
  }
}

export interface NestedMessage {
  stringField?: string | null | undefined;
}

//========================================//
//        Protobuf Encode / Decode        //
//========================================//

export const TreeshakingTest = {
  /**
   * Serializes TreeshakingTest to protobuf.
   */
  encode: function (msg: PartialDeep<TreeshakingTest>): Uint8Array {
    return TreeshakingTest._writeMessage(
      msg,
      new protoscript.BinaryWriter(),
    ).getResultBuffer();
  },

  /**
   * Deserializes TreeshakingTest from protobuf.
   */
  decode: function (bytes: ByteSource): TreeshakingTest {
    return TreeshakingTest._readMessage(
      TreeshakingTest.initialize(),
      new protoscript.BinaryReader(bytes),
    );
  },

  /**
   * Initializes TreeshakingTest with all fields set to their default value.
   */
  initialize: function (msg?: Partial<TreeshakingTest>): TreeshakingTest {
    return {
      stringField: "",
      repeatedStringField: [],
      boolField: false,
      repeatedMessageField: [],
      optionalMessageField: undefined,
      timestampField: protoscript.Timestamp.initialize(),
      mapField: {},
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<TreeshakingTest>,
    writer: protoscript.BinaryWriter,
  ): protoscript.BinaryWriter {
    if (msg.stringField) {
      writer.writeString(1, msg.stringField);
    }
    if (msg.repeatedStringField?.length) {
      writer.writeRepeatedString(2, msg.repeatedStringField);
    }
    if (msg.boolField) {
      writer.writeBool(3, msg.boolField);
    }
    if (msg.repeatedMessageField?.length) {
      writer.writeRepeatedMessage(
        4,
        msg.repeatedMessageField as any,
        NestedMessage._writeMessage,
      );
    }
    if (msg.optionalMessageField != undefined) {
      writer.writeMessage(
        5,
        msg.optionalMessageField,
        NestedMessage._writeMessage,
      );
    }
    if (msg.timestampField) {
      writer.writeMessage(
        6,
        msg.timestampField,
        protoscript.Timestamp._writeMessage,
      );
    }
    if (msg.mapField) {
      writer.writeRepeatedMessage(
        7,
        Object.entries(msg.mapField).map(([key, value]) => ({
          key: key as any,
          value: value as any,
        })) as any,
        TreeshakingTest.MapField._writeMessage,
      );
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (
    msg: TreeshakingTest,
    reader: protoscript.BinaryReader,
  ): TreeshakingTest {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          msg.stringField = reader.readString();
          break;
        }
        case 2: {
          msg.repeatedStringField.push(reader.readString());
          break;
        }
        case 3: {
          msg.boolField = reader.readBool();
          break;
        }
        case 4: {
          const m = NestedMessage.initialize();
          reader.readMessage(m, NestedMessage._readMessage);
          msg.repeatedMessageField.push(m);
          break;
        }
        case 5: {
          msg.optionalMessageField = NestedMessage.initialize();
          reader.readMessage(
            msg.optionalMessageField,
            NestedMessage._readMessage,
          );
          break;
        }
        case 6: {
          reader.readMessage(
            msg.timestampField,
            protoscript.Timestamp._readMessage,
          );
          break;
        }
        case 7: {
          const map = {} as TreeshakingTest.MapField;
          reader.readMessage(map, TreeshakingTest.MapField._readMessage);
          msg.mapField[map.key.toString()] = map.value;
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

  MapField: {
    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<TreeshakingTest.MapField>,
      writer: protoscript.BinaryWriter,
    ): protoscript.BinaryWriter {
      if (msg.key) {
        writer.writeString(1, msg.key);
      }
      if (msg.value) {
        writer.writeString(2, msg.value);
      }
      return writer;
    },

    /**
     * @private
     */
    _readMessage: function (
      msg: TreeshakingTest.MapField,
      reader: protoscript.BinaryReader,
    ): TreeshakingTest.MapField {
      while (reader.nextField()) {
        const field = reader.getFieldNumber();
        switch (field) {
          case 1: {
            msg.key = reader.readString();
            break;
          }
          case 2: {
            msg.value = reader.readString();
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

export const NestedMessage = {
  /**
   * Serializes NestedMessage to protobuf.
   */
  encode: function (msg: PartialDeep<NestedMessage>): Uint8Array {
    return NestedMessage._writeMessage(
      msg,
      new protoscript.BinaryWriter(),
    ).getResultBuffer();
  },

  /**
   * Deserializes NestedMessage from protobuf.
   */
  decode: function (bytes: ByteSource): NestedMessage {
    return NestedMessage._readMessage(
      NestedMessage.initialize(),
      new protoscript.BinaryReader(bytes),
    );
  },

  /**
   * Initializes NestedMessage with all fields set to their default value.
   */
  initialize: function (msg?: Partial<NestedMessage>): NestedMessage {
    return {
      stringField: undefined,
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<NestedMessage>,
    writer: protoscript.BinaryWriter,
  ): protoscript.BinaryWriter {
    if (msg.stringField != undefined) {
      writer.writeString(1, msg.stringField);
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (
    msg: NestedMessage,
    reader: protoscript.BinaryReader,
  ): NestedMessage {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          msg.stringField = reader.readString();
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

export const TreeshakingTestJSON = {
  /**
   * Serializes TreeshakingTest to JSON.
   */
  encode: function (msg: PartialDeep<TreeshakingTest>): string {
    return JSON.stringify(TreeshakingTestJSON._writeMessage(msg));
  },

  /**
   * Deserializes TreeshakingTest from JSON.
   */
  decode: function (json: string): TreeshakingTest {
    return TreeshakingTestJSON._readMessage(
      TreeshakingTestJSON.initialize(),
      JSON.parse(json),
    );
  },

  /**
   * Initializes TreeshakingTest with all fields set to their default value.
   */
  initialize: function (msg?: Partial<TreeshakingTest>): TreeshakingTest {
    return {
      stringField: "",
      repeatedStringField: [],
      boolField: false,
      repeatedMessageField: [],
      optionalMessageField: undefined,
      timestampField: protoscript.TimestampJSON.initialize(),
      mapField: {},
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<TreeshakingTest>,
  ): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.stringField) {
      json["stringField"] = msg.stringField;
    }
    if (msg.repeatedStringField?.length) {
      json["repeatedStringField"] = msg.repeatedStringField;
    }
    if (msg.boolField) {
      json["boolField"] = msg.boolField;
    }
    if (msg.repeatedMessageField?.length) {
      json["repeatedMessageField"] = msg.repeatedMessageField.map(
        NestedMessageJSON._writeMessage,
      );
    }
    if (msg.optionalMessageField != undefined) {
      const _optionalMessageField_ = NestedMessageJSON._writeMessage(
        msg.optionalMessageField,
      );
      json["optionalMessageField"] = _optionalMessageField_;
    }
    if (
      msg.timestampField &&
      msg.timestampField.seconds &&
      msg.timestampField.nanos
    ) {
      json["timestampField"] = protoscript.serializeTimestamp(
        msg.timestampField,
      );
    }
    if (msg.mapField) {
      const _mapField_ = Object.fromEntries(
        Object.entries(msg.mapField)
          .map(([key, value]) => ({ key: key as any, value: value as any }))
          .map(TreeshakingTestJSON.MapField._writeMessage)
          .map(({ key, value }) => [key, value]),
      );
      if (Object.keys(_mapField_).length > 0) {
        json["mapField"] = _mapField_;
      }
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: TreeshakingTest, json: any): TreeshakingTest {
    const _stringField_ = json["stringField"] ?? json["string_field"];
    if (_stringField_) {
      msg.stringField = _stringField_;
    }
    const _repeatedStringField_ =
      json["repeatedStringField"] ?? json["repeated_string_field"];
    if (_repeatedStringField_) {
      msg.repeatedStringField = _repeatedStringField_;
    }
    const _boolField_ = json["boolField"] ?? json["bool_field"];
    if (_boolField_) {
      msg.boolField = _boolField_;
    }
    const _repeatedMessageField_ =
      json["repeatedMessageField"] ?? json["repeated_message_field"];
    if (_repeatedMessageField_) {
      for (const item of _repeatedMessageField_) {
        const m = NestedMessageJSON.initialize();
        NestedMessageJSON._readMessage(m, item);
        msg.repeatedMessageField.push(m);
      }
    }
    const _optionalMessageField_ =
      json["optionalMessageField"] ?? json["optional_message_field"];
    if (_optionalMessageField_) {
      msg.optionalMessageField = NestedMessageJSON.initialize();
      NestedMessageJSON._readMessage(
        msg.optionalMessageField,
        _optionalMessageField_,
      );
    }
    const _timestampField_ = json["timestampField"] ?? json["timestamp_field"];
    if (_timestampField_) {
      msg.timestampField = protoscript.parseTimestamp(_timestampField_);
    }
    const _mapField_ = json["mapField"] ?? json["map_field"];
    if (_mapField_) {
      msg.mapField = Object.fromEntries(
        Object.entries(_mapField_)
          .map(([key, value]) => ({ key: key as any, value: value as any }))
          .map(TreeshakingTestJSON.MapField._readMessage)
          .map(({ key, value }) => [key, value]),
      );
    }
    return msg;
  },

  MapField: {
    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<TreeshakingTest.MapField>,
    ): Record<string, unknown> {
      const json: Record<string, unknown> = {};
      if (msg.key) {
        json["key"] = msg.key;
      }
      if (msg.value) {
        json["value"] = msg.value;
      }
      return json;
    },

    /**
     * @private
     */
    _readMessage: function (
      msg: TreeshakingTest.MapField,
      json: any,
    ): TreeshakingTest.MapField {
      const _key_ = json["key"];
      if (_key_) {
        msg.key = _key_;
      }
      const _value_ = json["value"];
      if (_value_) {
        msg.value = _value_;
      }
      return msg;
    },
  },
};

export const NestedMessageJSON = {
  /**
   * Serializes NestedMessage to JSON.
   */
  encode: function (msg: PartialDeep<NestedMessage>): string {
    return JSON.stringify(NestedMessageJSON._writeMessage(msg));
  },

  /**
   * Deserializes NestedMessage from JSON.
   */
  decode: function (json: string): NestedMessage {
    return NestedMessageJSON._readMessage(
      NestedMessageJSON.initialize(),
      JSON.parse(json),
    );
  },

  /**
   * Initializes NestedMessage with all fields set to their default value.
   */
  initialize: function (msg?: Partial<NestedMessage>): NestedMessage {
    return {
      stringField: undefined,
      ...msg,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<NestedMessage>,
  ): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.stringField != undefined) {
      json["stringField"] = msg.stringField;
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: NestedMessage, json: any): NestedMessage {
    const _stringField_ = json["stringField"] ?? json["string_field"];
    if (_stringField_) {
      msg.stringField = _stringField_;
    }
    return msg;
  },
};
