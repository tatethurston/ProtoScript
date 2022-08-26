#!/usr/bin/env node
import { readFileSync } from "fs";
import { compile } from "./codegen/compile.js";

const input = readFileSync(0);
const response = compile(input);
process.stdout.write(response.serializeBinary());
