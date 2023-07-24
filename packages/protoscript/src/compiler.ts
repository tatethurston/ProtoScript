#!/usr/bin/env node
import { compile, compiler } from "./codegen/compile.js";
await compiler(compile);
