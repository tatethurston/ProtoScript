import PluginPb from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import type { CodeGeneratorResponse as CodeGeneratorResponseType } from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import { generate } from "./autogenerate/index.js";
import {
  getProtobufTSFileName,
  buildIdentifierTable,
  getProtobufJSFileName,
} from "./utils.js";
import { format } from "prettier";
import { deserializeConfig } from "../cli/utils.js";
const { CodeGeneratorRequest, CodeGeneratorResponse } = PluginPb;

export function compile(input: Uint8Array): CodeGeneratorResponseType {
  const request = CodeGeneratorRequest.deserializeBinary(input);
  const options = deserializeConfig(request.getParameter() ?? "");
  const isTypescript = options.language === "typescript";
  const response = new CodeGeneratorResponse();
  response.setSupportedFeatures(
    CodeGeneratorResponse.Feature.FEATURE_PROTO3_OPTIONAL
  );

  const identifierTable = buildIdentifierTable(request);

  function writeFile(name: string, content: string) {
    const file = new CodeGeneratorResponse.File();
    file.setName(name);
    file.setContent(
      format(content, { parser: isTypescript ? "typescript" : "babel" })
    );
    response.addFile(file);
  }

  request.getProtoFileList().forEach((fileDescriptorProto) => {
    const name = fileDescriptorProto.getName();
    if (!name) {
      return;
    }

    const protobufTs = generate(fileDescriptorProto, identifierTable, options);
    writeFile(
      isTypescript ? getProtobufTSFileName(name) : getProtobufJSFileName(name),
      protobufTs
    );
  });

  return response;
}
