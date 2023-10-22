import { Baz, Foo, FooJSON } from "./message.pb.js";
import { OptionalSampleMessageJSON, SampleMessageJSON } from "./json.pb.js";

const nestedMessage: Foo.FooBar = {
  fieldOne: "foo",
  fieldTwo: {
    foo: 3n,
    bar: 4n,
  },

  fieldThree: [1, 2, 3],
};

const fullMessage: Foo = {
  fieldOne: 3,
  fieldTwo: {
    foo: {
      fieldOne: "foo",
      fieldTwo: {
        foo: 3n,
        bar: 4n,
      },

      fieldThree: [1, 2, 3],
    },
  },

  fieldThree: [
    {
      fieldOne: "foo",
      fieldTwo: {
        foo: 3n,
        bar: 4n,
      },

      fieldThree: [1, 2, 3],
    },
  ],

  fieldFour: nestedMessage,
  fieldFive: [1n, 2n],
  fieldSix: Baz.BAR,
  fieldSeven: [Baz.BAR, Baz.FOO],
  fieldEight: 223372036854775807n,
  fieldNine: new Uint8Array([8, 7]),
  fieldTen: [new Uint8Array([4])],
  fieldEleven: {
    fieldOne: "",
    fieldTwo: {},
    fieldThree: [],
  },
  fieldTwelve: undefined,
  fieldThirteen: nestedMessage,
  fieldFourteen: undefined,
  fieldFifteen: [],
};

const partialMessage: Partial<Foo> = {
  fieldOne: 3,
};

describe("Serialization/Deserialization", () => {
  describe("protobuf", () => {
    describe("deserialization", () => {
      it("empty deserialization", () => {
        expect(Foo.decode(Foo.encode({}))).toMatchInlineSnapshot(`
          {
            "fieldEight": 0n,
            "fieldEleven": undefined,
            "fieldFifteen": [],
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
            "fieldFourteen": undefined,
            "fieldNine": Uint8Array [],
            "fieldOne": undefined,
            "fieldSeven": [],
            "fieldSix": "FOO",
            "fieldTen": [],
            "fieldThirteen": undefined,
            "fieldThree": [],
            "fieldTwelve": undefined,
            "fieldTwo": {},
          }
        `);
      });

      it("partial deserialization", () => {
        expect(Foo.decode(Foo.encode(partialMessage))).toMatchInlineSnapshot(`
          {
            "fieldEight": 0n,
            "fieldEleven": undefined,
            "fieldFifteen": [],
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
            "fieldFourteen": undefined,
            "fieldNine": Uint8Array [],
            "fieldOne": 3,
            "fieldSeven": [],
            "fieldSix": "FOO",
            "fieldTen": [],
            "fieldThirteen": undefined,
            "fieldThree": [],
            "fieldTwelve": undefined,
            "fieldTwo": {},
          }
        `);
      });

      it("default message deserialization", () => {
        expect(Foo.decode(Foo.encode(Foo.initialize()))).toMatchInlineSnapshot(`
          {
            "fieldEight": 0n,
            "fieldEleven": undefined,
            "fieldFifteen": [],
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
            "fieldFourteen": undefined,
            "fieldNine": Uint8Array [],
            "fieldOne": undefined,
            "fieldSeven": [],
            "fieldSix": "FOO",
            "fieldTen": [],
            "fieldThirteen": undefined,
            "fieldThree": [],
            "fieldTwelve": undefined,
            "fieldTwo": {},
          }
        `);
      });

      it("full deserialization", () => {
        expect(Foo.decode(Foo.encode(fullMessage))).toMatchInlineSnapshot(`
          {
            "fieldEight": 223372036854775807n,
            "fieldEleven": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
            "fieldFifteen": [],
            "fieldFive": [
              1n,
              2n,
            ],
            "fieldFour": {
              "fieldOne": "foo",
              "fieldThree": [
                1,
                2,
                3,
              ],
              "fieldTwo": {
                "bar": 4n,
                "foo": 3n,
              },
            },
            "fieldFourteen": undefined,
            "fieldNine": Uint8Array [
              8,
              7,
            ],
            "fieldOne": 3,
            "fieldSeven": [
              "BAR",
              "FOO",
            ],
            "fieldSix": "BAR",
            "fieldTen": [
              Uint8Array [
                4,
              ],
            ],
            "fieldThirteen": {
              "fieldOne": "foo",
              "fieldThree": [
                1,
                2,
                3,
              ],
              "fieldTwo": {
                "bar": 4n,
                "foo": 3n,
              },
            },
            "fieldThree": [
              {
                "fieldOne": "foo",
                "fieldThree": [
                  1,
                  2,
                  3,
                ],
                "fieldTwo": {
                  "bar": 4n,
                  "foo": 3n,
                },
              },
            ],
            "fieldTwelve": undefined,
            "fieldTwo": {
              "foo": {
                "fieldOne": "foo",
                "fieldThree": [
                  1,
                  2,
                  3,
                ],
                "fieldTwo": {
                  "bar": 4n,
                  "foo": 3n,
                },
              },
            },
          }
        `);
      });
    });

    describe("serialization", () => {
      it("empty serialization", () => {
        expect(Foo.encode({})).toMatchInlineSnapshot(`Uint8Array []`);
      });

      it("partial serialization", () => {
        expect(Foo.encode(partialMessage)).toMatchInlineSnapshot(`
                  Uint8Array [
                    8,
                    3,
                  ]
              `);
      });

      it("default message serialization", () => {
        expect(Foo.encode(Foo.initialize())).toMatchInlineSnapshot(`
          Uint8Array [
            34,
            0,
          ]
        `);
      });

      it("full serialization", () => {
        expect(Foo.encode(fullMessage)).toMatchInlineSnapshot(`
          Uint8Array [
            8,
            3,
            18,
            35,
            10,
            3,
            102,
            111,
            111,
            18,
            28,
            10,
            3,
            102,
            111,
            111,
            18,
            7,
            10,
            3,
            102,
            111,
            111,
            16,
            3,
            18,
            7,
            10,
            3,
            98,
            97,
            114,
            16,
            4,
            26,
            3,
            1,
            2,
            3,
            26,
            28,
            10,
            3,
            102,
            111,
            111,
            18,
            7,
            10,
            3,
            102,
            111,
            111,
            16,
            3,
            18,
            7,
            10,
            3,
            98,
            97,
            114,
            16,
            4,
            26,
            3,
            1,
            2,
            3,
            34,
            28,
            10,
            3,
            102,
            111,
            111,
            18,
            7,
            10,
            3,
            102,
            111,
            111,
            16,
            3,
            18,
            7,
            10,
            3,
            98,
            97,
            114,
            16,
            4,
            26,
            3,
            1,
            2,
            3,
            42,
            2,
            1,
            2,
            48,
            1,
            58,
            2,
            1,
            0,
            64,
            255,
            255,
            239,
            235,
            241,
            245,
            228,
            140,
            3,
            74,
            2,
            8,
            7,
            82,
            1,
            4,
            90,
            0,
            106,
            28,
            10,
            3,
            102,
            111,
            111,
            18,
            7,
            10,
            3,
            102,
            111,
            111,
            16,
            3,
            18,
            7,
            10,
            3,
            98,
            97,
            114,
            16,
            4,
            26,
            3,
            1,
            2,
            3,
          ]
        `);
      });
    });
  });

  describe("json", () => {
    describe("deserialization", () => {
      it("empty deserialization", () => {
        expect(FooJSON.decode(FooJSON.encode({}))).toMatchInlineSnapshot(`
          {
            "fieldEight": 0n,
            "fieldEleven": undefined,
            "fieldFifteen": [],
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
            "fieldFourteen": undefined,
            "fieldNine": Uint8Array [],
            "fieldOne": undefined,
            "fieldSeven": [],
            "fieldSix": "FOO",
            "fieldTen": [],
            "fieldThirteen": undefined,
            "fieldThree": [],
            "fieldTwelve": undefined,
            "fieldTwo": {},
          }
        `);
      });

      it("partial deserialization", () => {
        expect(FooJSON.decode(FooJSON.encode(partialMessage)))
          .toMatchInlineSnapshot(`
          {
            "fieldEight": 0n,
            "fieldEleven": undefined,
            "fieldFifteen": [],
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
            "fieldFourteen": undefined,
            "fieldNine": Uint8Array [],
            "fieldOne": 3,
            "fieldSeven": [],
            "fieldSix": "FOO",
            "fieldTen": [],
            "fieldThirteen": undefined,
            "fieldThree": [],
            "fieldTwelve": undefined,
            "fieldTwo": {},
          }
        `);
      });

      it("default message deserialization", () => {
        expect(FooJSON.decode(FooJSON.encode(FooJSON.initialize())))
          .toMatchInlineSnapshot(`
          {
            "fieldEight": 0n,
            "fieldEleven": undefined,
            "fieldFifteen": [],
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
            "fieldFourteen": undefined,
            "fieldNine": Uint8Array [],
            "fieldOne": undefined,
            "fieldSeven": [],
            "fieldSix": "FOO",
            "fieldTen": [],
            "fieldThirteen": undefined,
            "fieldThree": [],
            "fieldTwelve": undefined,
            "fieldTwo": {},
          }
        `);
      });

      it("full deserialization", () => {
        expect(FooJSON.decode(FooJSON.encode(fullMessage)))
          .toMatchInlineSnapshot(`
          {
            "fieldEight": 223372036854775807n,
            "fieldEleven": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
            "fieldFifteen": [],
            "fieldFive": [
              1n,
              2n,
            ],
            "fieldFour": {
              "fieldOne": "foo",
              "fieldThree": [
                1,
                2,
                3,
              ],
              "fieldTwo": {
                "bar": "4",
                "foo": "3",
              },
            },
            "fieldFourteen": undefined,
            "fieldNine": Uint8Array [
              8,
              7,
            ],
            "fieldOne": 3,
            "fieldSeven": [
              "BAR",
              "FOO",
            ],
            "fieldSix": "BAR",
            "fieldTen": [
              Uint8Array [
                4,
              ],
            ],
            "fieldThirteen": {
              "fieldOne": "foo",
              "fieldThree": [
                1,
                2,
                3,
              ],
              "fieldTwo": {
                "bar": "4",
                "foo": "3",
              },
            },
            "fieldThree": [
              {
                "fieldOne": "foo",
                "fieldThree": [
                  1,
                  2,
                  3,
                ],
                "fieldTwo": {
                  "bar": "4",
                  "foo": "3",
                },
              },
            ],
            "fieldTwelve": undefined,
            "fieldTwo": {
              "foo": {
                "fieldOne": "foo",
                "fieldThree": [
                  1,
                  2,
                  3,
                ],
                "fieldTwo": {
                  "bar": "4",
                  "foo": "3",
                },
              },
            },
          }
        `);
      });

      it("original proto field name", () => {
        expect(FooJSON.decode('{ "field_one": 3 }')).toMatchInlineSnapshot(`
          {
            "fieldEight": 0n,
            "fieldEleven": undefined,
            "fieldFifteen": [],
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
            "fieldFourteen": undefined,
            "fieldNine": Uint8Array [],
            "fieldOne": 3,
            "fieldSeven": [],
            "fieldSix": "FOO",
            "fieldTen": [],
            "fieldThirteen": undefined,
            "fieldThree": [],
            "fieldTwelve": undefined,
            "fieldTwo": {},
          }
        `);
      });
    });

    describe("serialization", () => {
      it("empty serialization", () => {
        expect(FooJSON.encode({})).toMatchInlineSnapshot(`"{}"`);
      });

      it("partial serialization", () => {
        expect(FooJSON.encode(partialMessage)).toMatchInlineSnapshot(
          `"{"fieldOne":3}"`,
        );
      });

      it("default message serialization", () => {
        expect(FooJSON.encode(Foo.initialize())).toMatchInlineSnapshot(`"{}"`);
      });

      it("full serialization", () => {
        expect(FooJSON.encode(fullMessage)).toMatchInlineSnapshot(
          `"{"fieldOne":3,"fieldTwo":{"foo":{"fieldOne":"foo","fieldTwo":{"foo":"3","bar":"4"},"fieldThree":[1,2,3]}},"fieldThree":[{"fieldOne":"foo","fieldTwo":{"foo":"3","bar":"4"},"fieldThree":[1,2,3]}],"fieldFour":{"fieldOne":"foo","fieldTwo":{"foo":"3","bar":"4"},"fieldThree":[1,2,3]},"fieldFive":["1","2"],"fieldSix":"BAR","luckySeven":["BAR","FOO"],"fieldEight":"223372036854775807","fieldNine":"CAc=","fieldTen":["BA=="],"fieldEleven":{},"fieldThirteen":{"fieldOne":"foo","fieldTwo":{"foo":"3","bar":"4"},"fieldThree":[1,2,3]}}"`,
        );
      });
    });
  });
});

// https://protobuf.dev/programming-guides/proto3/#json
describe("Protobuf3 JSON", () => {
  describe("#decode", () => {
    it("populates default values when fields are missing", () => {
      const jsonString = "{}";
      const decodedMessage = SampleMessageJSON.decode(jsonString);

      expect(decodedMessage.sampleMessage).toEqual({ fooBar: "", g: 0n });
      expect(decodedMessage.sampleEnum).toEqual("FOO_BAR");
      expect(decodedMessage.sampleMap).toEqual({});
      expect(decodedMessage.sampleRepeated).toEqual([]);
      expect(decodedMessage.sampleBool).toEqual(false);
      expect(decodedMessage.sampleString).toEqual("");
      expect(decodedMessage.sampleBytes).toEqual(new Uint8Array());
      expect(decodedMessage.sampleInt32).toEqual(0);
      expect(decodedMessage.sampleFixed32).toEqual(0);
      expect(decodedMessage.sampleUint32).toEqual(0);
      expect(decodedMessage.sampleInt64).toEqual(0n);
      expect(decodedMessage.sampleFixed64).toEqual(0n);
      expect(decodedMessage.sampleUint64).toEqual(0n);
      expect(decodedMessage.sampleFloat).toEqual(0);
      expect(decodedMessage.sampleDouble).toEqual(0);
      expect(decodedMessage.sampleTimestamp).toEqual({ seconds: 0n, nanos: 0 });
      expect(decodedMessage.sampleDuration).toEqual({ seconds: 0n, nanos: 0 });
      expect(decodedMessage.sampleStruct).toEqual({ fields: {} });
    });

    it("populates default values when fields are null", () => {
      const jsonString = `{
        "sampleMessage": null,
        "sampleEnum": null,
        "sampleMap": null,
        "sampleRepeated": null,
        "sampleBool": null,
        "sampleString": null,
        "sampleBytes": null,
        "sampleInt32": null,
        "sampleFixed32": null,
        "sampleUint32": null,
        "sampleInt64": null,
        "sampleFixed64": null,
        "sampleUint64": null,
        "sampleFloat": null,
        "sampleDouble": null,
        "sampleTimestamp": null,
        "sampleDuration": null,
        "sampleStruct": null
      }`;
      const decodedMessage = SampleMessageJSON.decode(jsonString);

      expect(decodedMessage.sampleMessage).toEqual({ fooBar: "", g: 0n });
      expect(decodedMessage.sampleEnum).toEqual("FOO_BAR");
      expect(decodedMessage.sampleMap).toEqual({});
      expect(decodedMessage.sampleRepeated).toEqual([]);
      expect(decodedMessage.sampleBool).toEqual(false);
      expect(decodedMessage.sampleString).toEqual("");
      expect(decodedMessage.sampleBytes).toEqual(new Uint8Array());
      expect(decodedMessage.sampleInt32).toEqual(0);
      expect(decodedMessage.sampleFixed32).toEqual(0);
      expect(decodedMessage.sampleUint32).toEqual(0);
      expect(decodedMessage.sampleInt64).toEqual(0n);
      expect(decodedMessage.sampleFixed64).toEqual(0n);
      expect(decodedMessage.sampleUint64).toEqual(0n);
      expect(decodedMessage.sampleFloat).toEqual(0);
      expect(decodedMessage.sampleDouble).toEqual(0);
      expect(decodedMessage.sampleTimestamp).toEqual({ seconds: 0n, nanos: 0 });
      expect(decodedMessage.sampleDuration).toEqual({ seconds: 0n, nanos: 0 });
      expect(decodedMessage.sampleStruct).toEqual({ fields: {} });
    });

    it("preserves undefined for optional fields that are missing", () => {
      const jsonString = "{}";
      const decodedMessage = OptionalSampleMessageJSON.decode(jsonString);

      expect(decodedMessage.sampleMessage).toEqual(undefined);
      expect(decodedMessage.sampleEnum).toEqual(undefined);
      expect(decodedMessage.sampleMap).toEqual({});
      expect(decodedMessage.sampleRepeated).toEqual([]);
      expect(decodedMessage.sampleBool).toEqual(undefined);
      expect(decodedMessage.sampleString).toEqual(undefined);
      expect(decodedMessage.sampleBytes).toEqual(undefined);
      expect(decodedMessage.sampleInt32).toEqual(undefined);
      expect(decodedMessage.sampleFixed32).toEqual(undefined);
      expect(decodedMessage.sampleUint32).toEqual(undefined);
      expect(decodedMessage.sampleInt64).toEqual(undefined);
      expect(decodedMessage.sampleFixed64).toEqual(undefined);
      expect(decodedMessage.sampleUint64).toEqual(undefined);
      expect(decodedMessage.sampleFloat).toEqual(undefined);
      expect(decodedMessage.sampleDouble).toEqual(undefined);
      expect(decodedMessage.sampleTimestamp).toEqual(undefined);
      expect(decodedMessage.sampleDuration).toEqual(undefined);
      expect(decodedMessage.sampleStruct).toEqual(undefined);
    });

    it("preserves undefined for optional fields that are null", () => {
      const jsonString = `{
        "sampleMessage": null,
        "sampleEnum": null,
        "sampleMap": null,
        "sampleRepeated": null,
        "sampleBool": null,
        "sampleString": null,
        "sampleBytes": null,
        "sampleInt32": null,
        "sampleFixed32": null,
        "sampleUint32": null,
        "sampleInt64": null,
        "sampleFixed64": null,
        "sampleUint64": null,
        "sampleFloat": null,
        "sampleDouble": null,
        "sampleTimestamp": null,
        "sampleDuration": null,
        "sampleStruct": null
      }`;
      const decodedMessage = OptionalSampleMessageJSON.decode(jsonString);

      expect(decodedMessage.sampleMessage).toEqual(undefined);
      expect(decodedMessage.sampleEnum).toEqual(undefined);
      expect(decodedMessage.sampleMap).toEqual({});
      expect(decodedMessage.sampleRepeated).toEqual([]);
      expect(decodedMessage.sampleBool).toEqual(undefined);
      expect(decodedMessage.sampleString).toEqual(undefined);
      expect(decodedMessage.sampleBytes).toEqual(undefined);
      expect(decodedMessage.sampleInt32).toEqual(undefined);
      expect(decodedMessage.sampleFixed32).toEqual(undefined);
      expect(decodedMessage.sampleUint32).toEqual(undefined);
      expect(decodedMessage.sampleInt64).toEqual(undefined);
      expect(decodedMessage.sampleFixed64).toEqual(undefined);
      expect(decodedMessage.sampleUint64).toEqual(undefined);
      expect(decodedMessage.sampleFloat).toEqual(undefined);
      expect(decodedMessage.sampleDouble).toEqual(undefined);
      expect(decodedMessage.sampleTimestamp).toEqual(undefined);
      expect(decodedMessage.sampleDuration).toEqual(undefined);
      expect(decodedMessage.sampleStruct).toEqual(undefined);
    });

    it("reads lowerCamelCase field names", () => {
      const jsonString = `{
        "sampleMessage": {"fooBar": "test", "g": "12345"},
        "sampleEnum": "BAZ",
        "sampleMap": {"key": "value"},
        "sampleRepeated": ["item1", "item2"],
        "sampleBool": true,
        "sampleString": "sample",
        "sampleBytes": "${btoa("test")}",
        "sampleInt32": 32,
        "sampleFixed32": 32,
        "sampleUint32": 32,
        "sampleInt64": "64",
        "sampleFixed64": "64",
        "sampleUint64": "64",
        "sampleFloat": 1.23,
        "sampleDouble": 1.23,
        "sampleTimestamp": "1972-01-01T10:00:20.021Z",
        "sampleDuration": "1.003s",
        "sampleStruct": {"fields": {"field1": {"stringValue": "value1"}}}
      }`;
      const decodedMessage = SampleMessageJSON.decode(jsonString);

      expect(decodedMessage.sampleMessage).toEqual({
        fooBar: "test",
        g: 12345n,
      });
      expect(decodedMessage.sampleEnum).toEqual("BAZ");
      expect(decodedMessage.sampleMap).toEqual({ key: "value" });
      expect(decodedMessage.sampleRepeated).toEqual(["item1", "item2"]);
      expect(decodedMessage.sampleBool).toEqual(true);
      expect(decodedMessage.sampleString).toEqual("sample");
      expect(new TextDecoder().decode(decodedMessage.sampleBytes)).toEqual(
        "test",
      );
      expect(decodedMessage.sampleInt32).toEqual(32);
      expect(decodedMessage.sampleFixed32).toEqual(32);
      expect(decodedMessage.sampleUint32).toEqual(32);
      expect(decodedMessage.sampleInt64).toEqual(64n);
      expect(decodedMessage.sampleFixed64).toEqual(64n);
      expect(decodedMessage.sampleUint64).toEqual(64n);
      expect(decodedMessage.sampleFloat).toEqual(1.23);
      expect(decodedMessage.sampleDouble).toEqual(1.23);
      expect(decodedMessage.sampleTimestamp).toEqual({
        seconds: 63108020n,
        nanos: 21_000_000,
      });
      expect(decodedMessage.sampleDuration).toEqual({
        seconds: 1n,
        nanos: 3_000_000,
      });
      expect(decodedMessage.sampleStruct).toEqual({
        fields: { field1: { stringValue: "value1" } },
      });
    });

    it("reads the original field names", () => {
      const jsonString = `{
        "sample_message": {"foo_bar": "test", "g": "12345"},
        "sample_enum": "BAZ",
        "sample_map": {"key": "value"},
        "sample_repeated": ["item1", "item2"],
        "sample_bool": true,
        "sample_string": "sample",
        "sample_bytes": "${btoa("test")}",
        "sample_int32": 32,
        "sample_fixed32": 32,
        "sample_uint32": 32,
        "sample_int64": "64",
        "sample_fixed64": "64",
        "sample_uint64": "64",
        "sample_float": 1.23,
        "sample_double": 1.23,
        "sample_timestamp": "1972-01-01T10:00:20.021Z",
        "sample_duration": "1.003s",
        "sample_struct": {"fields": {"field1": {"stringValue": "value1"}}}
      }`;
      const decodedMessage = SampleMessageJSON.decode(jsonString);

      expect(decodedMessage.sampleMessage).toEqual({
        fooBar: "test",
        g: 12345n,
      });
      expect(decodedMessage.sampleEnum).toEqual("BAZ");
      expect(decodedMessage.sampleMap).toEqual({ key: "value" });
      expect(decodedMessage.sampleRepeated).toEqual(["item1", "item2"]);
      expect(decodedMessage.sampleBool).toEqual(true);
      expect(decodedMessage.sampleString).toEqual("sample");
      expect(new TextDecoder().decode(decodedMessage.sampleBytes)).toEqual(
        "test",
      );
      expect(decodedMessage.sampleInt32).toEqual(32);
      expect(decodedMessage.sampleFixed32).toEqual(32);
      expect(decodedMessage.sampleUint32).toEqual(32);
      expect(decodedMessage.sampleInt64).toEqual(64n);
      expect(decodedMessage.sampleFixed64).toEqual(64n);
      expect(decodedMessage.sampleUint64).toEqual(64n);
      expect(decodedMessage.sampleFloat).toEqual(1.23);
      expect(decodedMessage.sampleDouble).toEqual(1.23);
      expect(decodedMessage.sampleTimestamp).toEqual({
        seconds: 63108020n,
        nanos: 21_000_000,
      });
      expect(decodedMessage.sampleDuration).toEqual({
        seconds: 1n,
        nanos: 3_000_000,
      });
      expect(decodedMessage.sampleStruct).toEqual({
        fields: { field1: { stringValue: "value1" } },
      });
    });

    describe("message", () => {
      describe("nested message", () => {
        it("populates default values when fields are missing", () => {
          const jsonString = '{ "sampleMessage": {} }';
          const decodedMessage = SampleMessageJSON.decode(jsonString);

          expect(decodedMessage.sampleMessage).toEqual({ fooBar: "", g: 0n });
        });

        it("accepts nested messages with null values", () => {
          const jsonString = '{ "sampleMessage": { "fooBar": null } }';
          const decodedMessage = SampleMessageJSON.decode(jsonString);

          expect(decodedMessage.sampleMessage).toEqual({ fooBar: "", g: 0n });
        });
      });
    });

    describe("enum", () => {
      it("accepts the enum name", () => {
        const jsonString = `{
          "sampleEnum": "BAZ"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);
        expect(decodedMessage.sampleEnum).toEqual("BAZ");
      });

      it("accepts the integer values", () => {
        const jsonString = `{
          "sampleEnum": 1
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);
        expect(decodedMessage.sampleEnum).toEqual("BAZ");
      });
    });

    describe("bytes", () => {
      const bytes = new Uint8Array([251]);

      it("accepts standard base64 with padding", () => {
        const encoded = Buffer.from(bytes).toString("base64");
        const jsonString = `{
          "sampleBytes": "${encoded}"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);
        expect(decodedMessage.sampleBytes).toEqual(bytes);
      });

      it("accepts standard base64 without padding", () => {
        const encoded = Buffer.from(bytes)
          .toString("base64")
          .replace(/=+$/, "");
        const jsonString = `{
          "sampleBytes": "${encoded}"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);
        expect(decodedMessage.sampleBytes).toEqual(bytes);
      });

      it("accepts url-safe base64 with padding", () => {
        const encoded = Buffer.from(bytes).toString("base64url");
        const jsonString = `{
          "sampleBytes": "${encoded}"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);
        expect(decodedMessage.sampleBytes).toEqual(bytes);
      });

      it("accepts url-safe base64 without padding", () => {
        const encoded = Buffer.from(bytes)
          .toString("base64url")
          .replace(/=+$/, "");
        const jsonString = `{
          "sampleBytes": "${encoded}"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);
        expect(decodedMessage.sampleBytes).toEqual(bytes);
      });
    });

    describe("int32, fixed32, uint32", () => {
      it("accepts string values", () => {
        const jsonString = `{
          "sampleInt32": "32",
          "sampleFixed32": "32",
          "sampleUint32": "32"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleInt32).toEqual(32);
        expect(decodedMessage.sampleFixed32).toEqual(32);
        expect(decodedMessage.sampleUint32).toEqual(32);
      });

      it("accepts number values", () => {
        const jsonString = `{
          "sampleInt32": 32,
          "sampleFixed32": 32,
          "sampleUint32": 32
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleInt32).toEqual(32);
        expect(decodedMessage.sampleFixed32).toEqual(32);
        expect(decodedMessage.sampleUint32).toEqual(32);
      });
    });

    describe("int64, fixed64, uint64", () => {
      it("accepts string values", () => {
        const jsonString = `{
          "sampleInt64": "64",
          "sampleFixed64": "64",
          "sampleUint64": "64"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleInt64).toEqual(64n);
        expect(decodedMessage.sampleFixed64).toEqual(64n);
        expect(decodedMessage.sampleUint64).toEqual(64n);
      });

      it("accepts number values", () => {
        const jsonString = `{
          "sampleInt64": 64,
          "sampleFixed64": 64,
          "sampleUint64": 64
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleInt64).toEqual(64n);
        expect(decodedMessage.sampleFixed64).toEqual(64n);
        expect(decodedMessage.sampleUint64).toEqual(64n);
      });
    });

    describe("float, double", () => {
      it("accepts string values", () => {
        const jsonString = `{
          "sampleFloat": "1.23",
          "sampleDouble": "1.23"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleFloat).toEqual(1.23);
        expect(decodedMessage.sampleDouble).toEqual(1.23);
      });

      it("accepts number values", () => {
        const jsonString = `{
          "sampleFloat": 1.23,
          "sampleDouble": 1.23
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleFloat).toEqual(1.23);
        expect(decodedMessage.sampleDouble).toEqual(1.23);
      });

      describe("accepts special string value", () => {
        it("NaN", () => {
          const jsonString = `{
            "sampleFloat": "NaN",
            "sampleDouble": "NaN"
          }`;
          const decodedMessage = SampleMessageJSON.decode(jsonString);

          expect(decodedMessage.sampleFloat).toEqual(NaN);
          expect(decodedMessage.sampleDouble).toEqual(NaN);
        });

        it("Infinity", () => {
          const jsonString = `{
            "sampleFloat": "Infinity",
            "sampleDouble": "Infinity"
          }`;
          const decodedMessage = SampleMessageJSON.decode(jsonString);

          expect(decodedMessage.sampleFloat).toEqual(Infinity);
          expect(decodedMessage.sampleDouble).toEqual(Infinity);
        });

        it("-Infinity", () => {
          const jsonString = `{
            "sampleFloat": "-Infinity",
            "sampleDouble": "-Infinity"
          }`;
          const decodedMessage = SampleMessageJSON.decode(jsonString);

          expect(decodedMessage.sampleFloat).toEqual(-Infinity);
          expect(decodedMessage.sampleDouble).toEqual(-Infinity);
        });
      });

      describe("accepts -0", () => {
        it("as a string", () => {
          const jsonString = `{
            "sampleFloat": "-0",
            "sampleDouble": "-0"
          }`;
          const decodedMessage = SampleMessageJSON.decode(jsonString);

          expect(decodedMessage.sampleFloat).toEqual(-0);
          expect(decodedMessage.sampleDouble).toEqual(-0);
        });

        it("as a number", () => {
          const jsonString = `{
            "sampleFloat": -0,
            "sampleDouble": -0
          }`;
          const decodedMessage = SampleMessageJSON.decode(jsonString);

          expect(decodedMessage.sampleFloat).toEqual(0);
          expect(decodedMessage.sampleDouble).toEqual(0);
        });
      });

      describe("accepts exponent notation", () => {
        it("as a string", () => {
          const jsonString = `{
            "sampleFloat": "3e-5",
            "sampleDouble": "3e-5"
          }`;
          const decodedMessage = SampleMessageJSON.decode(jsonString);

          expect(decodedMessage.sampleFloat).toEqual(0.00003);
          expect(decodedMessage.sampleDouble).toEqual(0.00003);
        });

        it("as a number", () => {
          const jsonString = `{
            "sampleFloat": 3e-5,
            "sampleDouble": 3e-5 
          }`;
          const decodedMessage = SampleMessageJSON.decode(jsonString);

          expect(decodedMessage.sampleFloat).toEqual(0.00003);
          expect(decodedMessage.sampleDouble).toEqual(0.00003);
        });
      });
    });

    describe("Timestamp", () => {
      it("accepts 0 fractional digits", () => {
        const jsonString = `{
          "sampleTimestamp": "2023-10-18T04:02:27Z"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleTimestamp).toEqual({
          nanos: 0,
          seconds: 1697601747n,
        });
      });

      it("accepts 3 fractional digits", () => {
        const jsonString = `{
          "sampleTimestamp": "2023-10-18T04:02:27.123Z"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleTimestamp).toEqual({
          nanos: 123_000_000,
          seconds: 1697601747n,
        });
      });

      it("accepts 6 fractional digits", () => {
        const jsonString = `{
          "sampleTimestamp": "2023-10-18T04:02:27.123456Z"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleTimestamp).toEqual({
          nanos: 123_456_000,
          seconds: 1697601747n,
        });
      });

      it("accepts 9 fractional digits", () => {
        const jsonString = `{
          "sampleTimestamp": "2023-10-18T04:02:27.123456789Z"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleTimestamp).toEqual({
          nanos: 123_456_789,
          seconds: 1697601747n,
        });
      });

      it("accepts offsets other 'Z'", () => {
        const jsonString = `{
          "sampleTimestamp": "2023-10-18T04:02:27.123-06:00"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);
        expect(decodedMessage.sampleTimestamp).toEqual({
          nanos: 123_000_000,
          seconds: 1697623347n,
        });
      });
    });

    describe("Duration", () => {
      it("accepts 0 fractional digits", () => {
        const jsonString = `{
          "sampleDuration": "1s"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleDuration).toEqual({
          seconds: 1n,
          nanos: 0,
        });
      });

      it("accepts 3 fractional digits", () => {
        const jsonString = `{
          "sampleDuration": "1.003s"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleDuration).toEqual({
          seconds: 1n,
          nanos: 3000000,
        });
      });

      it("accepts 6 fractional digits", () => {
        const jsonString = `{
          "sampleDuration": "1.000003s"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleDuration).toEqual({
          seconds: 1n,
          nanos: 3000,
        });
      });

      it("accepts 9 fractional digits", () => {
        const jsonString = `{
          "sampleDuration": "1.000000003s"
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleDuration).toEqual({
          seconds: 1n,
          nanos: 3,
        });
      });
    });

    describe("Struct", () => {
      it("accepts any JSON object", () => {
        const jsonString = `{
          "sampleStruct": { "fields": { "this": { "is": { "a": { "sample": { "struct": true } } } } } }
        }`;
        const decodedMessage = SampleMessageJSON.decode(jsonString);

        expect(decodedMessage.sampleStruct).toEqual({
          fields: { this: { is: { a: { sample: { struct: true } } } } },
        });
      });
    });
  });

  describe("#encode", () => {
    it("does not populate fields with default values", () => {
      const msg = SampleMessageJSON.initialize();

      expect(msg).toEqual({
        sampleMessage: { fooBar: "", g: 0n },
        sampleEnum: "FOO_BAR",
        sampleMap: {},
        sampleRepeated: [],
        sampleBool: false,
        sampleString: "",
        sampleBytes: new Uint8Array(),
        sampleInt32: 0,
        sampleFixed32: 0,
        sampleUint32: 0,
        sampleInt64: 0n,
        sampleFixed64: 0n,
        sampleUint64: 0n,
        sampleFloat: 0,
        sampleDouble: 0,
        sampleTimestamp: { seconds: 0n, nanos: 0 },
        sampleDuration: { seconds: 0n, nanos: 0 },
        sampleStruct: { fields: {} },
      });

      expect(SampleMessageJSON.encode(msg)).toEqual("{}");
    });

    it("does populate optional fields with default values", () => {
      const msg = SampleMessageJSON.initialize();

      expect(msg).toEqual({
        sampleMessage: { fooBar: "", g: 0n },
        sampleEnum: "FOO_BAR",
        sampleMap: {},
        sampleRepeated: [],
        sampleBool: false,
        sampleString: "",
        sampleBytes: new Uint8Array(),
        sampleInt32: 0,
        sampleFixed32: 0,
        sampleUint32: 0,
        sampleInt64: 0n,
        sampleFixed64: 0n,
        sampleUint64: 0n,
        sampleFloat: 0,
        sampleDouble: 0,
        sampleTimestamp: { seconds: 0n, nanos: 0 },
        sampleDuration: { seconds: 0n, nanos: 0 },
        sampleStruct: { fields: {} },
      });

      expect(OptionalSampleMessageJSON.encode(msg)).toEqual(
        `{"sampleMessage":{"fooBar":"","g":"0"},"sampleEnum":"FOO_BAR","sampleBool":false,"sampleString":"","sampleInt32":0,"sampleFixed32":0,"sampleUint32":0,"sampleInt64":"0","sampleFixed64":"0","sampleUint64":"0","sampleFloat":0,"sampleDouble":0,"sampleTimestamp":"1970-01-01T00:00:00.000Z","sampleDuration":"0s","sampleStruct":{}}`,
      );
    });

    it("does not populate optional fields for missing values", () => {
      const msg = OptionalSampleMessageJSON.initialize();

      expect(msg).toEqual({
        sampleMessage: undefined,
        sampleEnum: undefined,
        sampleMap: {},
        sampleRepeated: [],
        sampleBool: undefined,
        sampleString: undefined,
        sampleBytes: undefined,
        sampleInt32: undefined,
        sampleFixed32: undefined,
        sampleUint32: undefined,
        sampleInt64: undefined,
        sampleFixed64: undefined,
        sampleUint64: undefined,
        sampleFloat: undefined,
        sampleDouble: undefined,
        sampleTimestamp: undefined,
        sampleDuration: undefined,
        sampleStruct: undefined,
      });

      expect(OptionalSampleMessageJSON.encode(msg)).toEqual("{}");
    });

    it("populates field values", () => {
      const msg = SampleMessageJSON.initialize();
      msg.sampleMessage = { fooBar: "test", g: 12345n };
      msg.sampleEnum = "BAZ";
      msg.sampleMap = { key: "value" };
      msg.sampleRepeated = ["item1", "item2"];
      msg.sampleBool = true;
      msg.sampleString = "sample";
      msg.sampleBytes = new Uint8Array([1, 2, 3]);
      msg.sampleInt32 = 32;
      msg.sampleFixed32 = 32;
      msg.sampleUint32 = 32;
      msg.sampleInt64 = 64n;
      msg.sampleFixed64 = 64n;
      msg.sampleUint64 = 64n;
      msg.sampleFloat = 1.23;
      msg.sampleDouble = 1.23;
      msg.sampleTimestamp = { seconds: 63108020n, nanos: 21_000_000 };
      msg.sampleDuration = { seconds: 1n, nanos: 3_000_000 };
      msg.sampleStruct = { fields: { field1: { stringValue: "value1" } } };

      expect(SampleMessageJSON.encode(msg)).toEqual(
        `{"sampleMessage":{"fooBar":"test","g":"12345"},"sampleEnum":"BAZ","sampleMap":{"key":"value"},"sampleRepeated":["item1","item2"],"sampleBool":true,"sampleString":"sample","sampleBytes":"AQID","sampleInt32":32,"sampleFixed32":32,"sampleUint32":32,"sampleInt64":"64","sampleFixed64":"64","sampleUint64":"64","sampleFloat":1.23,"sampleDouble":1.23,"sampleTimestamp":"1972-01-01T10:00:20.021Z","sampleDuration":"1.003s","sampleStruct":{"fields":{"field1":{"stringValue":"value1"}}}}`,
      );
    });
  });
});
