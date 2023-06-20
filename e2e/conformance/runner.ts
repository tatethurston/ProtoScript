#!/usr/bin/env node

import {
  ConformanceRequest,
  ConformanceResponse,
  FailureSet,
  WireFormat,
} from "./proto/conformance/conformance.pb.js";
import {
  TestAllTypesProto3,
  TestAllTypesProto3JSON,
} from "./proto/google/protobuf/test_messages_proto3.pb.js";
import { readSync, writeSync } from "node:fs";

function main() {
  let testCount = 0;
  try {
    while (testIo(test)) {
      testCount += 1;
    }
  } catch (e) {
    process.stderr.write(
      `conformance.ts: exiting after ${testCount} tests: ${String(e)}`
    );
    process.exit(1);
  }
}

function test(request: ConformanceRequest): ConformanceResponse {
  switch (request.messageType) {
    // The conformance runner will request a list of failures as the first request.
    // This will be known by message_type == "conformance.FailureSet", a conformance
    // test should return a serialized FailureSet in protobuf_payload.
    case "conformance.FailureSet": {
      return {
        protobufPayload: FailureSet.encode({}),
      };
    }
    case "protobuf_test_messages.proto3.TestAllTypesProto3": {
      break;
    }
    case "protobuf_test_messages.proto2.TestAllTypesProto2": {
      return {
        runtimeError:
          "Protobuf2 Tests are skipped because TwirpScript targets Protobuf3",
      };
    }
    default: {
      return {
        runtimeError: `unknown request message type ${request.messageType}`,
      };
    }
  }

  let testMessage: TestAllTypesProto3;
  try {
    if (request.protobufPayload) {
      testMessage = TestAllTypesProto3.decode(request.protobufPayload);
    } else if (request.jsonPayload) {
      testMessage = TestAllTypesProto3JSON.decode(request.jsonPayload);
    } else {
      return { runtimeError: `${request} not supported` };
    }
  } catch (err) {
    // > This string should be set to indicate parsing failed.  The string can
    // > provide more information about the parse error if it is available.
    // >
    // > Setting this string does not necessarily mean the testee failed the
    // > test.  Some of the test cases are intentionally invalid input.
    return { parseError: String(err) };
  }

  try {
    switch (request.requestedOutputFormat) {
      case WireFormat.PROTOBUF: {
        return { protobufPayload: TestAllTypesProto3.encode(testMessage) };
      }
      case WireFormat.JSON: {
        return { jsonPayload: TestAllTypesProto3JSON.encode(testMessage) };
      }
      case WireFormat.JSPB: {
        return { skipped: "JSPB not supported." };
      }
      case WireFormat.TEXT_FORMAT: {
        return { skipped: "Text format not supported." };
      }
      default: {
        return {
          runtimeError: `unknown requested output format ${request.requestedOutputFormat}`,
        };
      }
    }
  } catch (err) {
    // > If the input was successfully parsed but errors occurred when
    // > serializing it to the requested output format, set the error message in
    // > this field.
    return { serializeError: String(err) };
  }
}

// Returns true if the test ran successfully, false on legitimate EOF.
// If EOF is encountered in an unexpected place, raises IOError.
function testIo(
  test: (request: ConformanceRequest) => ConformanceResponse
): boolean {
  setBlockingStdout();

  const requestLengthBuf = readBuffer(4);
  if (requestLengthBuf === "EOF") {
    return false;
  }

  const requestLength = requestLengthBuf.readInt32LE(0);
  const serializedRequest = readBuffer(requestLength);
  if (serializedRequest === "EOF") {
    throw "Failed to read request.";
  }

  const request = ConformanceRequest.decode(serializedRequest);
  const response = test(request);

  const serializedResponse = ConformanceResponse.encode(response);
  const responseLengthBuf = Buffer.alloc(4);
  responseLengthBuf.writeInt32LE(serializedResponse.length, 0);
  writeBuffer(responseLengthBuf);
  writeBuffer(Buffer.from(serializedResponse));

  return true;
}

// Read a buffer of N bytes from stdin.
function readBuffer(bytes: number): Buffer | "EOF" {
  const buf = Buffer.alloc(bytes);
  let read = 0;
  try {
    read = readSync(0, buf, 0, bytes, null);
  } catch (e) {
    throw `failed to read from stdin: ${String(e)}`;
  }
  if (read !== bytes) {
    if (read === 0) {
      return "EOF";
    }
    throw "premature EOF on stdin.";
  }
  return buf;
}

// Write a buffer to stdout.
function writeBuffer(buffer: Buffer): void {
  let totalWritten = 0;
  while (totalWritten < buffer.length) {
    totalWritten += writeSync(
      1,
      buffer,
      totalWritten,
      buffer.length - totalWritten
    );
  }
}

// Fixes https://github.com/timostamm/protobuf-ts/issues/134
// Node is buffering chunks to stdout, meaning that for big generated
// files the CodeGeneratorResponse will not reach protoc completely.
// To fix this, we set stdout to block using the internal private
// method setBlocking(true)
function setBlockingStdout(): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
  const stdoutHandle = (process.stdout as any)._handle;
  if (stdoutHandle !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    stdoutHandle.setBlocking(true);
  }
}

main();
