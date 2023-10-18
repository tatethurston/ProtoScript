// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// Source: message.proto
/* eslint-disable */

import type { ByteSource, PartialDeep } from "protoscript";
import * as protoscript from "protoscript";

//========================================//
//                 Types                  //
//========================================//

export type Baz = "FOO" | "BAR";

export interface Foo {
  fieldOne?: number | null | undefined;
  fieldTwo: Record<string, Foo.FieldTwo["value"] | undefined>;
  fieldThree: Bar[];
  fieldFour: Foo.FooBar;
  fieldFive: bigint[];
  fieldSix: Baz;
  fieldSeven: Baz[];
  fieldEight: bigint;
  fieldNine: Uint8Array;
  fieldTen: Uint8Array[];
  fieldEleven?: Bar | null | undefined;
  fieldTwelve?: Bar | null | undefined;
  fieldThirteen?: Bar | null | undefined;
  fieldFourteen: Foo | null | undefined;
  fieldFifteen: Foo[];
}

export declare namespace Foo {
  export interface FooBar {
    fieldOne: string;
    fieldTwo: Record<string, Foo.FooBar.FieldTwo["value"] | undefined>;
    fieldThree: number[];
  }

  namespace FooBar {
    interface FieldTwo {
      key: string;
      value: bigint;
    }
  }

  interface FieldTwo {
    key: string;
    value: Bar;
  }
}

export interface Bar {
  fieldOne: string;
  fieldTwo: Record<string, Bar.FieldTwo["value"] | undefined>;
  fieldThree: number[];
}

export declare namespace Bar {
  interface FieldTwo {
    key: string;
    value: bigint;
  }
}

//========================================//
//        Protobuf Encode / Decode        //
//========================================//

export const Baz = {
  FOO: "FOO",
  BAR: "BAR",
  /**
   * @private
   */
  _fromInt: function (i: number): Baz {
    switch (i) {
      case 0: {
        return "FOO";
      }
      case 1: {
        return "BAR";
      }
      // unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
      default: {
        return i as unknown as Baz;
      }
    }
  },
  /**
   * @private
   */
  _toInt: function (i: Baz): number {
    switch (i) {
      case "FOO": {
        return 0;
      }
      case "BAR": {
        return 1;
      }
      // unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
      default: {
        return i as unknown as number;
      }
    }
  },
} as const;

export const Foo = {
  /**
   * Serializes Foo to protobuf.
   */
  encode: function (msg: PartialDeep<Foo>): Uint8Array {
    return Foo._writeMessage(
      msg,
      new protoscript.BinaryWriter(),
    ).getResultBuffer();
  },

  /**
   * Deserializes Foo from protobuf.
   */
  decode: function (bytes: ByteSource): Foo {
    return Foo._readMessage(
      Foo.initialize(),
      new protoscript.BinaryReader(bytes),
    );
  },

  /**
   * Initializes Foo with all fields set to their default value.
   */
  initialize: function (): Foo {
    return {
      fieldOne: undefined,
      fieldTwo: {},
      fieldThree: [],
      fieldFour: Foo.FooBar.initialize(),
      fieldFive: [],
      fieldSix: Baz._fromInt(0),
      fieldSeven: [],
      fieldEight: 0n,
      fieldNine: new Uint8Array(),
      fieldTen: [],
      fieldEleven: undefined,
      fieldTwelve: undefined,
      fieldThirteen: undefined,
      fieldFourteen: undefined,
      fieldFifteen: [],
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<Foo>,
    writer: protoscript.BinaryWriter,
  ): protoscript.BinaryWriter {
    if (msg.fieldOne != undefined) {
      writer.writeInt32(1, msg.fieldOne);
    }
    if (msg.fieldTwo) {
      writer.writeRepeatedMessage(
        2,
        Object.entries(msg.fieldTwo).map(([key, value]) => ({
          key: key as any,
          value: value as any,
        })) as any,
        Foo.FieldTwo._writeMessage,
      );
    }
    if (msg.fieldThree?.length) {
      writer.writeRepeatedMessage(3, msg.fieldThree as any, Bar._writeMessage);
    }
    if (msg.fieldFour) {
      writer.writeMessage(4, msg.fieldFour, Foo.FooBar._writeMessage);
    }
    if (msg.fieldFive?.length) {
      writer.writePackedInt64String(
        5,
        msg.fieldFive.map((x) => x.toString() as any),
      );
    }
    if (msg.fieldSix && Baz._toInt(msg.fieldSix)) {
      writer.writeEnum(6, Baz._toInt(msg.fieldSix));
    }
    if (msg.fieldSeven?.length) {
      writer.writePackedEnum(7, msg.fieldSeven.map(Baz._toInt));
    }
    if (msg.fieldEight) {
      writer.writeInt64String(8, msg.fieldEight.toString() as any);
    }
    if (msg.fieldNine?.length) {
      writer.writeBytes(9, msg.fieldNine);
    }
    if (msg.fieldTen?.length) {
      writer.writeRepeatedBytes(10, msg.fieldTen);
    }
    if (msg.fieldEleven != undefined) {
      writer.writeMessage(11, msg.fieldEleven, Bar._writeMessage);
    }
    if (msg.fieldTwelve != undefined) {
      writer.writeMessage(12, msg.fieldTwelve, Bar._writeMessage);
    }
    if (msg.fieldThirteen != undefined) {
      writer.writeMessage(13, msg.fieldThirteen, Bar._writeMessage);
    }
    if (msg.fieldFourteen) {
      writer.writeMessage(14, msg.fieldFourteen, Foo._writeMessage);
    }
    if (msg.fieldFifteen?.length) {
      writer.writeRepeatedMessage(
        15,
        msg.fieldFifteen as any,
        Foo._writeMessage,
      );
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Foo, reader: protoscript.BinaryReader): Foo {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          msg.fieldOne = reader.readInt32();
          break;
        }
        case 2: {
          const map = {} as Foo.FieldTwo;
          reader.readMessage(map, Foo.FieldTwo._readMessage);
          msg.fieldTwo[map.key.toString()] = map.value;
          break;
        }
        case 3: {
          const m = Bar.initialize();
          reader.readMessage(m, Bar._readMessage);
          msg.fieldThree.push(m);
          break;
        }
        case 4: {
          reader.readMessage(msg.fieldFour, Foo.FooBar._readMessage);
          break;
        }
        case 5: {
          if (reader.isDelimited()) {
            msg.fieldFive.push(...reader.readPackedInt64String().map(BigInt));
          } else {
            msg.fieldFive.push(BigInt(reader.readInt64String()));
          }
          break;
        }
        case 6: {
          msg.fieldSix = Baz._fromInt(reader.readEnum());
          break;
        }
        case 7: {
          if (reader.isDelimited()) {
            msg.fieldSeven.push(...reader.readPackedEnum().map(Baz._fromInt));
          } else {
            msg.fieldSeven.push(Baz._fromInt(reader.readEnum()));
          }
          break;
        }
        case 8: {
          msg.fieldEight = BigInt(reader.readInt64String());
          break;
        }
        case 9: {
          msg.fieldNine = reader.readBytes();
          break;
        }
        case 10: {
          msg.fieldTen.push(reader.readBytes());
          break;
        }
        case 11: {
          msg.fieldEleven = Bar.initialize();
          reader.readMessage(msg.fieldEleven, Bar._readMessage);
          break;
        }
        case 12: {
          msg.fieldTwelve = Bar.initialize();
          reader.readMessage(msg.fieldTwelve, Bar._readMessage);
          break;
        }
        case 13: {
          msg.fieldThirteen = Bar.initialize();
          reader.readMessage(msg.fieldThirteen, Bar._readMessage);
          break;
        }
        case 14: {
          msg.fieldFourteen = Foo.initialize();
          reader.readMessage(msg.fieldFourteen, Foo._readMessage);
          break;
        }
        case 15: {
          const m = Foo.initialize();
          reader.readMessage(m, Foo._readMessage);
          msg.fieldFifteen.push(m);
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

  FooBar: {
    /**
     * Serializes Foo.FooBar to protobuf.
     */
    encode: function (msg: PartialDeep<Foo.FooBar>): Uint8Array {
      return Foo.FooBar._writeMessage(
        msg,
        new protoscript.BinaryWriter(),
      ).getResultBuffer();
    },

    /**
     * Deserializes Foo.FooBar from protobuf.
     */
    decode: function (bytes: ByteSource): Foo.FooBar {
      return Foo.FooBar._readMessage(
        Foo.FooBar.initialize(),
        new protoscript.BinaryReader(bytes),
      );
    },

    /**
     * Initializes Foo.FooBar with all fields set to their default value.
     */
    initialize: function (): Foo.FooBar {
      return {
        fieldOne: "",
        fieldTwo: {},
        fieldThree: [],
      };
    },

    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<Foo.FooBar>,
      writer: protoscript.BinaryWriter,
    ): protoscript.BinaryWriter {
      if (msg.fieldOne) {
        writer.writeString(1, msg.fieldOne);
      }
      if (msg.fieldTwo) {
        writer.writeRepeatedMessage(
          2,
          Object.entries(msg.fieldTwo).map(([key, value]) => ({
            key: key as any,
            value: value as any,
          })) as any,
          Foo.FooBar.FieldTwo._writeMessage,
        );
      }
      if (msg.fieldThree?.length) {
        writer.writePackedInt32(3, msg.fieldThree);
      }
      return writer;
    },

    /**
     * @private
     */
    _readMessage: function (
      msg: Foo.FooBar,
      reader: protoscript.BinaryReader,
    ): Foo.FooBar {
      while (reader.nextField()) {
        const field = reader.getFieldNumber();
        switch (field) {
          case 1: {
            msg.fieldOne = reader.readString();
            break;
          }
          case 2: {
            const map = {} as Foo.FooBar.FieldTwo;
            reader.readMessage(map, Foo.FooBar.FieldTwo._readMessage);
            msg.fieldTwo[map.key.toString()] = map.value;
            break;
          }
          case 3: {
            if (reader.isDelimited()) {
              msg.fieldThree.push(...reader.readPackedInt32());
            } else {
              msg.fieldThree.push(reader.readInt32());
            }
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

    FieldTwo: {
      /**
       * @private
       */
      _writeMessage: function (
        msg: PartialDeep<Foo.FooBar.FieldTwo>,
        writer: protoscript.BinaryWriter,
      ): protoscript.BinaryWriter {
        if (msg.key) {
          writer.writeString(1, msg.key);
        }
        if (msg.value) {
          writer.writeInt64String(2, msg.value.toString() as any);
        }
        return writer;
      },

      /**
       * @private
       */
      _readMessage: function (
        msg: Foo.FooBar.FieldTwo,
        reader: protoscript.BinaryReader,
      ): Foo.FooBar.FieldTwo {
        while (reader.nextField()) {
          const field = reader.getFieldNumber();
          switch (field) {
            case 1: {
              msg.key = reader.readString();
              break;
            }
            case 2: {
              msg.value = BigInt(reader.readInt64String());
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
  },

  FieldTwo: {
    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<Foo.FieldTwo>,
      writer: protoscript.BinaryWriter,
    ): protoscript.BinaryWriter {
      if (msg.key) {
        writer.writeString(1, msg.key);
      }
      if (msg.value) {
        writer.writeMessage(2, msg.value, Bar._writeMessage);
      }
      return writer;
    },

    /**
     * @private
     */
    _readMessage: function (
      msg: Foo.FieldTwo,
      reader: protoscript.BinaryReader,
    ): Foo.FieldTwo {
      while (reader.nextField()) {
        const field = reader.getFieldNumber();
        switch (field) {
          case 1: {
            msg.key = reader.readString();
            break;
          }
          case 2: {
            msg.value = Bar.initialize();
            reader.readMessage(msg.value, Bar._readMessage);
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

export const Bar = {
  /**
   * Serializes Bar to protobuf.
   */
  encode: function (msg: PartialDeep<Bar>): Uint8Array {
    return Bar._writeMessage(
      msg,
      new protoscript.BinaryWriter(),
    ).getResultBuffer();
  },

  /**
   * Deserializes Bar from protobuf.
   */
  decode: function (bytes: ByteSource): Bar {
    return Bar._readMessage(
      Bar.initialize(),
      new protoscript.BinaryReader(bytes),
    );
  },

  /**
   * Initializes Bar with all fields set to their default value.
   */
  initialize: function (): Bar {
    return {
      fieldOne: "",
      fieldTwo: {},
      fieldThree: [],
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<Bar>,
    writer: protoscript.BinaryWriter,
  ): protoscript.BinaryWriter {
    if (msg.fieldOne) {
      writer.writeString(1, msg.fieldOne);
    }
    if (msg.fieldTwo) {
      writer.writeRepeatedMessage(
        2,
        Object.entries(msg.fieldTwo).map(([key, value]) => ({
          key: key as any,
          value: value as any,
        })) as any,
        Bar.FieldTwo._writeMessage,
      );
    }
    if (msg.fieldThree?.length) {
      writer.writePackedInt32(3, msg.fieldThree);
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Bar, reader: protoscript.BinaryReader): Bar {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          msg.fieldOne = reader.readString();
          break;
        }
        case 2: {
          const map = {} as Bar.FieldTwo;
          reader.readMessage(map, Bar.FieldTwo._readMessage);
          msg.fieldTwo[map.key.toString()] = map.value;
          break;
        }
        case 3: {
          if (reader.isDelimited()) {
            msg.fieldThree.push(...reader.readPackedInt32());
          } else {
            msg.fieldThree.push(reader.readInt32());
          }
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

  FieldTwo: {
    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<Bar.FieldTwo>,
      writer: protoscript.BinaryWriter,
    ): protoscript.BinaryWriter {
      if (msg.key) {
        writer.writeString(1, msg.key);
      }
      if (msg.value) {
        writer.writeInt64String(2, msg.value.toString() as any);
      }
      return writer;
    },

    /**
     * @private
     */
    _readMessage: function (
      msg: Bar.FieldTwo,
      reader: protoscript.BinaryReader,
    ): Bar.FieldTwo {
      while (reader.nextField()) {
        const field = reader.getFieldNumber();
        switch (field) {
          case 1: {
            msg.key = reader.readString();
            break;
          }
          case 2: {
            msg.value = BigInt(reader.readInt64String());
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

//========================================//
//          JSON Encode / Decode          //
//========================================//

export const BazJSON = {
  FOO: "FOO",
  BAR: "BAR",
  /**
   * @private
   */
  _fromInt: function (i: number): Baz {
    switch (i) {
      case 0: {
        return "FOO";
      }
      case 1: {
        return "BAR";
      }
      // unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
      default: {
        return i as unknown as Baz;
      }
    }
  },
  /**
   * @private
   */
  _toInt: function (i: Baz): number {
    switch (i) {
      case "FOO": {
        return 0;
      }
      case "BAR": {
        return 1;
      }
      // unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
      default: {
        return i as unknown as number;
      }
    }
  },
} as const;

export const FooJSON = {
  /**
   * Serializes Foo to JSON.
   */
  encode: function (msg: PartialDeep<Foo>): string {
    return JSON.stringify(FooJSON._writeMessage(msg));
  },

  /**
   * Deserializes Foo from JSON.
   */
  decode: function (json: string): Foo {
    return FooJSON._readMessage(FooJSON.initialize(), JSON.parse(json));
  },

  /**
   * Initializes Foo with all fields set to their default value.
   */
  initialize: function (): Foo {
    return {
      fieldOne: undefined,
      fieldTwo: {},
      fieldThree: [],
      fieldFour: FooJSON.FooBar.initialize(),
      fieldFive: [],
      fieldSix: Baz._fromInt(0),
      fieldSeven: [],
      fieldEight: 0n,
      fieldNine: new Uint8Array(),
      fieldTen: [],
      fieldEleven: undefined,
      fieldTwelve: undefined,
      fieldThirteen: undefined,
      fieldFourteen: undefined,
      fieldFifteen: [],
    };
  },

  /**
   * @private
   */
  _writeMessage: function (msg: PartialDeep<Foo>): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.fieldOne != undefined) {
      json["fieldOne"] = msg.fieldOne;
    }
    if (msg.fieldTwo) {
      const _fieldTwo_ = Object.fromEntries(
        Object.entries(msg.fieldTwo)
          .map(([key, value]) => ({ key: key as any, value: value as any }))
          .map(FooJSON.FieldTwo._writeMessage)
          .map(({ key, value }) => [key, value]),
      );
      if (Object.keys(_fieldTwo_).length > 0) {
        json["fieldTwo"] = _fieldTwo_;
      }
    }
    if (msg.fieldThree?.length) {
      json["fieldThree"] = msg.fieldThree.map(BarJSON._writeMessage);
    }
    if (msg.fieldFour) {
      const _fieldFour_ = FooJSON.FooBar._writeMessage(msg.fieldFour);
      if (Object.keys(_fieldFour_).length > 0) {
        json["fieldFour"] = _fieldFour_;
      }
    }
    if (msg.fieldFive?.length) {
      json["fieldFive"] = msg.fieldFive.map(String);
    }
    if (msg.fieldSix && BazJSON._toInt(msg.fieldSix)) {
      json["fieldSix"] = msg.fieldSix;
    }
    if (msg.fieldSeven?.length) {
      json["luckySeven"] = msg.fieldSeven;
    }
    if (msg.fieldEight) {
      json["fieldEight"] = String(msg.fieldEight);
    }
    if (msg.fieldNine?.length) {
      json["fieldNine"] = protoscript.serializeBytes(msg.fieldNine);
    }
    if (msg.fieldTen?.length) {
      json["fieldTen"] = msg.fieldTen.map(protoscript.serializeBytes);
    }
    if (msg.fieldEleven != undefined) {
      const _fieldEleven_ = BarJSON._writeMessage(msg.fieldEleven);
      json["fieldEleven"] = _fieldEleven_;
    }
    if (msg.fieldTwelve != undefined) {
      const _fieldTwelve_ = BarJSON._writeMessage(msg.fieldTwelve);
      json["fieldTwelve"] = _fieldTwelve_;
    }
    if (msg.fieldThirteen != undefined) {
      const _fieldThirteen_ = BarJSON._writeMessage(msg.fieldThirteen);
      json["fieldThirteen"] = _fieldThirteen_;
    }
    if (msg.fieldFourteen) {
      const _fieldFourteen_ = FooJSON._writeMessage(msg.fieldFourteen);
      if (Object.keys(_fieldFourteen_).length > 0) {
        json["fieldFourteen"] = _fieldFourteen_;
      }
    }
    if (msg.fieldFifteen?.length) {
      json["fieldFifteen"] = msg.fieldFifteen.map(FooJSON._writeMessage);
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Foo, json: any): Foo {
    const _fieldOne_ = json["fieldOne"] ?? json["field_one"];
    if (_fieldOne_) {
      msg.fieldOne = protoscript.parseNumber(_fieldOne_);
    }
    const _fieldTwo_ = json["fieldTwo"] ?? json["field_two"];
    if (_fieldTwo_) {
      msg.fieldTwo = Object.fromEntries(
        Object.entries(_fieldTwo_)
          .map(([key, value]) => ({ key: key as any, value: value as any }))
          .map(FooJSON.FieldTwo._readMessage)
          .map(({ key, value }) => [key, value]),
      );
    }
    const _fieldThree_ = json["fieldThree"] ?? json["field_three"];
    if (_fieldThree_) {
      for (const item of _fieldThree_) {
        const m = BarJSON.initialize();
        BarJSON._readMessage(m, item);
        msg.fieldThree.push(m);
      }
    }
    const _fieldFour_ = json["fieldFour"] ?? json["field_four"];
    if (_fieldFour_) {
      FooJSON.FooBar._readMessage(msg.fieldFour, _fieldFour_);
    }
    const _fieldFive_ = json["fieldFive"] ?? json["field_five"];
    if (_fieldFive_) {
      msg.fieldFive = _fieldFive_.map(BigInt);
    }
    const _fieldSix_ = json["fieldSix"] ?? json["field_six"];
    if (_fieldSix_) {
      msg.fieldSix = Baz._fromInt(_fieldSix_);
    }
    const _fieldSeven_ =
      json["luckySeven"] ?? json["fieldSeven"] ?? json["field_seven"];
    if (_fieldSeven_) {
      msg.fieldSeven = _fieldSeven_.map(Baz._fromInt);
    }
    const _fieldEight_ = json["fieldEight"] ?? json["field_eight"];
    if (_fieldEight_) {
      msg.fieldEight = BigInt(_fieldEight_);
    }
    const _fieldNine_ = json["fieldNine"] ?? json["field_nine"];
    if (_fieldNine_) {
      msg.fieldNine = protoscript.parseBytes(_fieldNine_);
    }
    const _fieldTen_ = json["fieldTen"] ?? json["field_ten"];
    if (_fieldTen_) {
      msg.fieldTen = _fieldTen_.map(protoscript.parseBytes);
    }
    const _fieldEleven_ = json["fieldEleven"] ?? json["field_eleven"];
    if (_fieldEleven_) {
      msg.fieldEleven = BarJSON.initialize();
      BarJSON._readMessage(msg.fieldEleven, _fieldEleven_);
    }
    const _fieldTwelve_ = json["fieldTwelve"] ?? json["field_twelve"];
    if (_fieldTwelve_) {
      msg.fieldTwelve = BarJSON.initialize();
      BarJSON._readMessage(msg.fieldTwelve, _fieldTwelve_);
    }
    const _fieldThirteen_ = json["fieldThirteen"] ?? json["field_thirteen"];
    if (_fieldThirteen_) {
      msg.fieldThirteen = BarJSON.initialize();
      BarJSON._readMessage(msg.fieldThirteen, _fieldThirteen_);
    }
    const _fieldFourteen_ = json["fieldFourteen"] ?? json["field_fourteen"];
    if (_fieldFourteen_) {
      msg.fieldFourteen = FooJSON.initialize();
      FooJSON._readMessage(msg.fieldFourteen, _fieldFourteen_);
    }
    const _fieldFifteen_ = json["fieldFifteen"] ?? json["field_fifteen"];
    if (_fieldFifteen_) {
      for (const item of _fieldFifteen_) {
        const m = FooJSON.initialize();
        FooJSON._readMessage(m, item);
        msg.fieldFifteen.push(m);
      }
    }
    return msg;
  },

  FooBar: {
    /**
     * Serializes Foo.FooBar to JSON.
     */
    encode: function (msg: PartialDeep<Foo.FooBar>): string {
      return JSON.stringify(FooJSON.FooBar._writeMessage(msg));
    },

    /**
     * Deserializes Foo.FooBar from JSON.
     */
    decode: function (json: string): Foo.FooBar {
      return FooJSON.FooBar._readMessage(
        FooJSON.FooBar.initialize(),
        JSON.parse(json),
      );
    },

    /**
     * Initializes Foo.FooBar with all fields set to their default value.
     */
    initialize: function (): Foo.FooBar {
      return {
        fieldOne: "",
        fieldTwo: {},
        fieldThree: [],
      };
    },

    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<Foo.FooBar>,
    ): Record<string, unknown> {
      const json: Record<string, unknown> = {};
      if (msg.fieldOne) {
        json["fieldOne"] = msg.fieldOne;
      }
      if (msg.fieldTwo) {
        const _fieldTwo_ = Object.fromEntries(
          Object.entries(msg.fieldTwo)
            .map(([key, value]) => ({ key: key as any, value: value as any }))
            .map(FooJSON.FooBar.FieldTwo._writeMessage)
            .map(({ key, value }) => [key, value]),
        );
        if (Object.keys(_fieldTwo_).length > 0) {
          json["fieldTwo"] = _fieldTwo_;
        }
      }
      if (msg.fieldThree?.length) {
        json["fieldThree"] = msg.fieldThree;
      }
      return json;
    },

    /**
     * @private
     */
    _readMessage: function (msg: Foo.FooBar, json: any): Foo.FooBar {
      const _fieldOne_ = json["fieldOne"] ?? json["field_one"];
      if (_fieldOne_) {
        msg.fieldOne = _fieldOne_;
      }
      const _fieldTwo_ = json["fieldTwo"] ?? json["field_two"];
      if (_fieldTwo_) {
        msg.fieldTwo = Object.fromEntries(
          Object.entries(_fieldTwo_)
            .map(([key, value]) => ({ key: key as any, value: value as any }))
            .map(FooJSON.FooBar.FieldTwo._readMessage)
            .map(({ key, value }) => [key, value]),
        );
      }
      const _fieldThree_ = json["fieldThree"] ?? json["field_three"];
      if (_fieldThree_) {
        msg.fieldThree = _fieldThree_.map(protoscript.parseNumber);
      }
      return msg;
    },

    FieldTwo: {
      /**
       * @private
       */
      _writeMessage: function (
        msg: PartialDeep<Foo.FooBar.FieldTwo>,
      ): Record<string, unknown> {
        const json: Record<string, unknown> = {};
        if (msg.key) {
          json["key"] = msg.key;
        }
        if (msg.value) {
          json["value"] = String(msg.value);
        }
        return json;
      },

      /**
       * @private
       */
      _readMessage: function (
        msg: Foo.FooBar.FieldTwo,
        json: any,
      ): Foo.FooBar.FieldTwo {
        const _key_ = json["key"];
        if (_key_) {
          msg.key = _key_;
        }
        const _value_ = json["value"];
        if (_value_) {
          msg.value = BigInt(_value_);
        }
        return msg;
      },
    },
  },

  FieldTwo: {
    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<Foo.FieldTwo>,
    ): Record<string, unknown> {
      const json: Record<string, unknown> = {};
      if (msg.key) {
        json["key"] = msg.key;
      }
      if (msg.value) {
        const _value_ = BarJSON._writeMessage(msg.value);
        if (Object.keys(_value_).length > 0) {
          json["value"] = _value_;
        }
      }
      return json;
    },

    /**
     * @private
     */
    _readMessage: function (msg: Foo.FieldTwo, json: any): Foo.FieldTwo {
      const _key_ = json["key"];
      if (_key_) {
        msg.key = _key_;
      }
      const _value_ = json["value"];
      if (_value_) {
        BarJSON._readMessage(msg.value, _value_);
      }
      return msg;
    },
  },
};

export const BarJSON = {
  /**
   * Serializes Bar to JSON.
   */
  encode: function (msg: PartialDeep<Bar>): string {
    return JSON.stringify(BarJSON._writeMessage(msg));
  },

  /**
   * Deserializes Bar from JSON.
   */
  decode: function (json: string): Bar {
    return BarJSON._readMessage(BarJSON.initialize(), JSON.parse(json));
  },

  /**
   * Initializes Bar with all fields set to their default value.
   */
  initialize: function (): Bar {
    return {
      fieldOne: "",
      fieldTwo: {},
      fieldThree: [],
    };
  },

  /**
   * @private
   */
  _writeMessage: function (msg: PartialDeep<Bar>): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.fieldOne) {
      json["fieldOne"] = msg.fieldOne;
    }
    if (msg.fieldTwo) {
      const _fieldTwo_ = Object.fromEntries(
        Object.entries(msg.fieldTwo)
          .map(([key, value]) => ({ key: key as any, value: value as any }))
          .map(BarJSON.FieldTwo._writeMessage)
          .map(({ key, value }) => [key, value]),
      );
      if (Object.keys(_fieldTwo_).length > 0) {
        json["fieldTwo"] = _fieldTwo_;
      }
    }
    if (msg.fieldThree?.length) {
      json["fieldThree"] = msg.fieldThree;
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Bar, json: any): Bar {
    const _fieldOne_ = json["fieldOne"] ?? json["field_one"];
    if (_fieldOne_) {
      msg.fieldOne = _fieldOne_;
    }
    const _fieldTwo_ = json["fieldTwo"] ?? json["field_two"];
    if (_fieldTwo_) {
      msg.fieldTwo = Object.fromEntries(
        Object.entries(_fieldTwo_)
          .map(([key, value]) => ({ key: key as any, value: value as any }))
          .map(BarJSON.FieldTwo._readMessage)
          .map(({ key, value }) => [key, value]),
      );
    }
    const _fieldThree_ = json["fieldThree"] ?? json["field_three"];
    if (_fieldThree_) {
      msg.fieldThree = _fieldThree_.map(protoscript.parseNumber);
    }
    return msg;
  },

  FieldTwo: {
    /**
     * @private
     */
    _writeMessage: function (
      msg: PartialDeep<Bar.FieldTwo>,
    ): Record<string, unknown> {
      const json: Record<string, unknown> = {};
      if (msg.key) {
        json["key"] = msg.key;
      }
      if (msg.value) {
        json["value"] = String(msg.value);
      }
      return json;
    },

    /**
     * @private
     */
    _readMessage: function (msg: Bar.FieldTwo, json: any): Bar.FieldTwo {
      const _key_ = json["key"];
      if (_key_) {
        msg.key = _key_;
      }
      const _value_ = json["value"];
      if (_value_) {
        msg.value = BigInt(_value_);
      }
      return msg;
    },
  },
};
