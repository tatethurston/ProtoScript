import { describe, it } from "@jest/globals";
import * as esbuild from "esbuild";

describe("Treeshaking", () => {
  describe("json", () => {
    it("shakes out binary serdes", () => {
      const result = esbuild.buildSync({
        entryPoints: ["./TreeshakingTestJSON.ts"],
        absWorkingDir: __dirname,
        bundle: true,
        write: false,
      });

      const contents = result.outputFiles[0].contents;
      const code = Buffer.from(contents).toString("utf8");
      expect(code).not.toMatch(/(BinaryReader|BinaryWriter)/);
    });
  });
});
