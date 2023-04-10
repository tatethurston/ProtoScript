import { printHeading } from "./index.js";

describe("printHeading", () => {
  it("short names", () => {
    expect(printHeading("Types")).toMatchInlineSnapshot(`
      "  //========================================//
        //                 Types                  //
        //========================================//
        
        "
    `);
  });

  it("long names", () => {
    expect(printHeading("VeryLongNameThatCausesAnErrorService"))
      .toMatchInlineSnapshot(`
      "  //========================================//
        //  VeryLongNameThatCausesAnErrorService  //
        //========================================//
        
        "
    `);
  });
});
