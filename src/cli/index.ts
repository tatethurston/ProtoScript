#!/usr/bin/env node
import { join } from "path";
import { fileURLToPath } from "url";
import { main } from "./core.js";
import { isWindows } from "./utils.js";

const compiler = join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  `compiler.${isWindows ? "cmd" : "js"}`
);

void main({
  compiler: { path: compiler },
});
