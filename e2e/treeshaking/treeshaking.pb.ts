// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// Source: treeshaking.proto
/* eslint-disable */

import type { ByteSource } from "protoscript";
import { BinaryReader, BinaryWriter } from "protoscript";

//========================================//
//                 Types                  //
//========================================//

export interface TreeshakingTest {
  stringField: string;
  repeatedStringField: string[];
  boolField: boolean;
  repeatedMessageField: NestedMessage[];
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
  encode: function (msg: Partial<TreeshakingTest>): Uint8Array {
    return TreeshakingTest._writeMessage(
      msg,
      new BinaryWriter()
    ).getResultBuffer();
  },

  /**
   * Deserializes TreeshakingTest from protobuf.
   */
  decode: function (bytes: ByteSource): TreeshakingTest {
    return TreeshakingTest._readMessage(
      TreeshakingTest.initialize(),
      new BinaryReader(bytes)
    );
  },

  /**
   * Initializes TreeshakingTest with all fields set to their default value.
   */
  initialize: function (): TreeshakingTest {
    return {
      stringField: "",
      repeatedStringField: [],
      boolField: false,
      repeatedMessageField: [],
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: Partial<TreeshakingTest>,
    writer: BinaryWriter
  ): BinaryWriter {
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
        NestedMessage._writeMessage
      );
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (
    msg: TreeshakingTest,
    reader: BinaryReader
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
        default: {
          reader.skipField();
          break;
        }
      }
    }
    return msg;
  },
};

export const NestedMessage = {
  /**
   * Serializes NestedMessage to protobuf.
   */
  encode: function (msg: Partial<NestedMessage>): Uint8Array {
    return NestedMessage._writeMessage(
      msg,
      new BinaryWriter()
    ).getResultBuffer();
  },

  /**
   * Deserializes NestedMessage from protobuf.
   */
  decode: function (bytes: ByteSource): NestedMessage {
    return NestedMessage._readMessage(
      NestedMessage.initialize(),
      new BinaryReader(bytes)
    );
  },

  /**
   * Initializes NestedMessage with all fields set to their default value.
   */
  initialize: function (): NestedMessage {
    return {
      stringField: undefined,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: Partial<NestedMessage>,
    writer: BinaryWriter
  ): BinaryWriter {
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
    reader: BinaryReader
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
  encode: function (msg: Partial<TreeshakingTest>): string {
    return JSON.stringify(TreeshakingTestJSON._writeMessage(msg));
  },

  /**
   * Deserializes TreeshakingTest from JSON.
   */
  decode: function (json: string): TreeshakingTest {
    return TreeshakingTestJSON._readMessage(
      TreeshakingTestJSON.initialize(),
      JSON.parse(json)
    );
  },

  /**
   * Initializes TreeshakingTest with all fields set to their default value.
   */
  initialize: function (): TreeshakingTest {
    return {
      stringField: "",
      repeatedStringField: [],
      boolField: false,
      repeatedMessageField: [],
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: Partial<TreeshakingTest>
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
        NestedMessageJSON._writeMessage
      );
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
    return msg;
  },
};

export const NestedMessageJSON = {
  /**
   * Serializes NestedMessage to JSON.
   */
  encode: function (msg: Partial<NestedMessage>): string {
    return JSON.stringify(NestedMessageJSON._writeMessage(msg));
  },

  /**
   * Deserializes NestedMessage from JSON.
   */
  decode: function (json: string): NestedMessage {
    return NestedMessageJSON._readMessage(
      NestedMessageJSON.initialize(),
      JSON.parse(json)
    );
  },

  /**
   * Initializes NestedMessage with all fields set to their default value.
   */
  initialize: function (): NestedMessage {
    return {
      stringField: undefined,
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: Partial<NestedMessage>
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
