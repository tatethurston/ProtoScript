import { spawnSync } from "child_process";

function run(cmd: string) {
  return spawnSync(cmd, { shell: true, encoding: "utf8" });
}

describe("Conformance", () => {
  beforeAll(() => {
    process.chdir(__dirname);
  });

  it("proto3 tests", () => {
    const result = run(
      `./bin/conformance_test_runner \
        --enforce_recommended \
        --output_dir . \
        ./dist/runner.cjs`
    );

    expect(result.output).not.toEqual(undefined);
  });
});
