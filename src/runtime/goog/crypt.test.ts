import { stringToUint8Array, byteArrayToString } from "./crypt";

const str = "hello 👋";
const bytes = [104, 101, 108, 108, 111, 32, 240, 159, 145, 139];

describe("byteArrayToString", () => {
  it("number[]", () => {
    expect(byteArrayToString(bytes)).toEqual(str);
  });

  it("reversible", () => {
    expect(byteArrayToString(stringToUint8Array(str))).toEqual(str);
  });
});

describe("stringToUint8Array", () => {
  it("string", () => {
    expect(stringToUint8Array(str)).toEqual(new Uint8Array(bytes));
  });
});
