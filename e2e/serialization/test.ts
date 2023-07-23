import { describe, it } from "@jest/globals";
import { Baz, Foo, FooJSON } from "./message.pb.js";

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
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
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
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
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
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
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
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
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
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
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
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
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
            "fieldFive": [],
            "fieldFour": {
              "fieldOne": "",
              "fieldThree": [],
              "fieldTwo": {},
            },
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
