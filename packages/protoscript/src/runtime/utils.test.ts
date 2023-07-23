import { byteSourceToUint8Array } from "./utils.js";

describe("byteSourceToUint8Array", () => {
  const bytes = [104, 101, 108, 108, 111, 32, 240, 159, 145, 139];
  const uint8array = new Uint8Array(bytes);

  it("ArrayBuffer", () => {
    expect(byteSourceToUint8Array(uint8array.buffer)).toEqual(uint8array);
  });

  it("Uint8Array", () => {
    expect(byteSourceToUint8Array(uint8array)).toEqual(uint8array);
  });

  it("number[]", () => {
    expect(byteSourceToUint8Array(bytes)).toEqual(uint8array);
  });

  it("string", () => {
    expect(byteSourceToUint8Array("hello 👋")).toEqual(uint8array);
  });
});
