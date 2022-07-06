/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-explicit-any */
import type { FileDescriptorProto } from "google-protobuf/google/protobuf/descriptor_pb.js";
import { IdentifierTable, ProtoTypes, processTypes } from "../utils.js";
import { UserConfig } from "../../cli/index.js";

const DEFAULT_IMPORT_TRACKER = {
  hasBytes: false,
};

let IMPORT_TRACKER: typeof DEFAULT_IMPORT_TRACKER;

function writeTypes(types: ProtoTypes[], isTopLevel: boolean): string {
  let result = "";

  types.forEach((node) => {
    const name = node.content.name;
    if (node.content.comments?.leading) {
      result += printComments(node.content.comments.leading);
    }
    if (node.type === "enum") {
      result += `export type ${name} = ${node.content.values
        .map((x) => `| '${x.name}'`)
        .join("\n")}\n\n`;
    } else {
      result += `${printIf(
        !node.content.isMap,
        "export "
      )}interface ${name} {\n`;
      node.content.fields.forEach(
        ({ name: fieldName, tsType, repeated, optional, comments, map }) => {
          if (comments?.leading) {
            result += printComments(comments.leading);
          }

          result += `${fieldName}${printIf(optional, "?")}:`;
          if (map) {
            result += `Record<string, ${tsType}['value'] | undefined>`;
          } else {
            result += tsType;
            if (optional) {
              result += "| null | undefined";
            } else if (repeated) {
              result += "[]";
            }
          }

          result += ";\n";
        }
      );
      result += "}\n\n";

      if (node.children.length > 0) {
        result += `${printIf(
          isTopLevel,
          "export declare"
        )} namespace ${name} { \n`;
        result += writeTypes(node.children, false) + "\n\n";
        result += `}\n\n`;
      }
    }
  });

  return result;
}

const toMapMessage = (name: string) =>
  `Object.entries(${name}).map(([key, value]) => ({ key: key ${printIfTypescript(
    "as any"
  )}, value: value ${printIfTypescript("as any")} }))`;

const fromMapMessage = (x: string) =>
  `Object.fromEntries(${x}.map(({ key, value }) => [key, value]))`;

function writeProtobufSerializers(
  types: ProtoTypes[],
  isTopLevel: boolean
): string {
  let result = "";

  types.forEach((node) => {
    result += isTopLevel
      ? `export const ${node.content.name} = {`
      : `${node.content.name}: {`;

    switch (node.type) {
      case "message": {
        const isEmpty = node.content.fields.length === 0;

        if (!node.content.isMap) {
          // encode (protobuf)
          result += `\
          /**
           * Serializes ${node.content.fullyQualifiedName} to protobuf.
           */
            `;
          if (isEmpty) {
            result += `encode: function(_msg${printIfTypescript(
              `?: Partial<${node.content.fullyQualifiedName}>`
            )})${printIfTypescript(`: Uint8Array`)} {
              return new Uint8Array();`;
          } else {
            result += `encode: function(msg${printIfTypescript(
              `: Partial<${node.content.fullyQualifiedName}>`
            )})${printIfTypescript(`: Uint8Array`)} {
            return ${
              node.content.fullyQualifiedName
            }._writeMessage(msg, new BinaryWriter()).getResultBuffer();`;
          }
          result += "},\n\n";

          // decode (protobuf)
          result += `\
          /**
           * Deserializes ${node.content.fullyQualifiedName} from protobuf.
           */
          `;
          if (isEmpty) {
            result += `decode: function(_bytes${printIfTypescript(
              `?: ByteSource`
            )})${printIfTypescript(`: ${node.content.fullyQualifiedName}`)} {
              return {};`;
          } else {
            result += `decode: function(bytes${printIfTypescript(
              `: ByteSource`
            )})${printIfTypescript(`: ${node.content.fullyQualifiedName}`)} {
            return ${node.content.fullyQualifiedName}._readMessage(${
              node.content.fullyQualifiedName
            }.initialize(), new BinaryReader(bytes));`;
          }
          result += "},\n\n";

          // initialize
          result += `\
          /**
           * Initializes ${
             node.content.fullyQualifiedName
           } with all fields set to their default value.
           */
          initialize: function()${printIfTypescript(
            `: ${node.content.fullyQualifiedName}`
          )} {
            return {
              ${node.content.fields
                .map((field) => {
                  if (field.optional) {
                    return `${field.name}: undefined,`;
                  }
                  if (field.repeated) {
                    return `${field.name}: [],`;
                  } else if (field.read === "readMessage" && !field.map) {
                    return `${field.name}: ${field.tsType}.initialize(),`;
                  } else {
                    return `${field.name}: ${field.defaultValue},`;
                  }
                })
                .join("")}
            };`;
          result += "},\n\n";
        }

        // private: encode (protobuf)
        result += `\
        /**
         * @private
         */
        _writeMessage: function(${printIf(isEmpty, "_")}msg${printIfTypescript(
          `: ${`Partial<${node.content.fullyQualifiedName}>`}`
        )}, writer${printIfTypescript(`: BinaryWriter`)})${printIfTypescript(
          `: BinaryWriter`
        )} {
          ${node.content.fields
            .map((field) => {
              let res = "";
              if (field.repeated || field.read === "readBytes") {
                res += `if (msg.${field.name}?.length) {`;
              } else if (field.optional) {
                res += `if (msg.${field.name} != undefined) {`;
              } else if (field.read === "readEnum") {
                res += `if (msg.${field.name} && ${field.tsType}._toInt(msg.${field.name})) {`;
              } else {
                res += `if (msg.${field.name}) {`;
              }

              if (field.read === "readMessage") {
                res += `writer.${field.write}(${field.index}, 
                  ${
                    field.map
                      ? toMapMessage(`msg.${field.name}`)
                      : `msg.${field.name}`
                  } ${
                  field.write === "writeRepeatedMessage"
                    ? printIfTypescript("as any")
                    : ""
                }, ${field.tsType}._writeMessage);`;
              } else {
                res += `writer.${field.write}(${field.index}, `;
                if (field.tsType === "bigint") {
                  if (field.repeated) {
                    res += `msg.${
                      field.name
                    }.map(x => x.toString() ${printIfTypescript("as any")})`;
                  } else {
                    res += `msg.${field.name}.toString() ${printIfTypescript(
                      "as any"
                    )}`;
                  }
                } else if (field.read === "readEnum") {
                  if (field.repeated) {
                    res += `msg.${field.name}.map(${field.tsType}._toInt)`;
                  } else {
                    res += `${field.tsType}._toInt(msg.${field.name})`;
                  }
                } else {
                  res += `msg.${field.name}`;
                }
                res += ");";
              }

              res += "}";
              return res;
            })
            .join("\n")}
            return writer;`;
        result += "},\n\n";

        // private: decode (protobuf)
        result += `\
        /**
         * @private
         */
        `;
        if (isEmpty) {
          result += `_readMessage: function(_msg${printIfTypescript(
            `: ${`${node.content.fullyQualifiedName}`}`
          )}, _reader${printIfTypescript(`: BinaryReader`)})${printIfTypescript(
            `: ${`${node.content.fullyQualifiedName}`}`
          )}{
            return _msg;`;
        } else {
          result += `_readMessage: function(msg${printIfTypescript(
            `: ${`${node.content.fullyQualifiedName}`}`
          )}, reader${printIfTypescript(`: BinaryReader`)})${printIfTypescript(
            `: ${`${node.content.fullyQualifiedName}`}`
          )}{
            while (reader.nextField()) {
              const field = reader.getFieldNumber();
              switch (field) {
                ${node.content.fields
                  .map((field) => {
                    let res = "";
                    res += `case ${field.index}: {`;
                    if (field.read === "readMessage") {
                      if (field.map) {
                        res += `
                        const map = {}${printIfTypescript(
                          ` as ${field.tsType}`
                        )};
                        reader.readMessage(map, ${field.tsType}._readMessage);
                        msg.${field.name}[map.key${printIf(
                          field.tsType !== "string",
                          ".toString()"
                        )}] = map.value;
                      `;
                      } else if (field.repeated) {
                        res += `const m = ${field.tsType}.initialize();`;
                        res += `reader.readMessage(m, ${field.tsType}._readMessage);`;
                        res += `msg.${field.name}.push(m);`;
                      } else {
                        if (field.optional || node.content.isMap) {
                          res += `msg.${field.name} = ${field.tsType}.initialize();`;
                        }
                        res += `reader.readMessage(msg.${field.name}, ${field.tsType}._readMessage);`;
                      }
                    } else {
                      let converter;
                      if (field.read === "readEnum") {
                        converter = `${field.tsType}._fromInt`;
                      } else if (field.tsType === "bigint") {
                        converter = "BigInt";
                      }
                      if (field.repeated) {
                        if (converter) {
                          if (field.readPacked) {
                            res += `if (reader.isDelimited()) {`;
                            res += `msg.${field.name}.push(...reader.${field.readPacked}().map(${converter}));`;
                            res += `} else {`;
                            res += `msg.${field.name}.push(${converter}(reader.${field.read}()));`;
                            res += `}`;
                          } else {
                            res += `msg.${field.name}.push(${converter}(reader.${field.read}()));`;
                          }
                        } else {
                          if (field.readPacked) {
                            res += `if (reader.isDelimited()) {`;
                            res += `msg.${field.name}.push(...reader.${field.readPacked}());`;
                            res += `} else {`;
                            res += `msg.${field.name}.push(reader.${field.read}());`;
                            res += `}`;
                          } else {
                            res += `msg.${field.name}.push(reader.${field.read}());`;
                          }
                        }
                      } else {
                        if (converter) {
                          res += `msg.${field.name} = ${converter}(reader.${field.read}());`;
                        } else {
                          res += `msg.${field.name} = reader.${field.read}();`;
                        }
                      }
                    }
                    res += "break;\n}";
                    return res;
                  })
                  .join("\n")}
                default: {
                  reader.skipField();
                  break;
                }
              }
            }
            return msg;`;
        }
        result += "},\n\n";
        result += writeProtobufSerializers(node.children, false);
        result += `}${isTopLevel ? ";" : ","}\n\n`;
        break;
      }

      case "enum": {
        // constant map
        node.content.values.forEach(({ name, comments }) => {
          if (comments?.leading) {
            result += printComments(comments.leading);
          }
          result += `${name}: '${name}',\n`;
        });
        // to enum
        result += `\
        /**
         * @private
         */
        _fromInt: `;
        result += `function(i${printIfTypescript(
          ": number"
        )})${printIfTypescript(`: ${node.content.fullyQualifiedName}`)} {
          switch (i) {
        `;
        node.content.values.forEach(({ name, value }) => {
          result += `case ${value}: { return '${name}'; }\n`;
        });

        result += `// unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
        default: { return i${printIfTypescript(
          ` as unknown as ${node.content.fullyQualifiedName}`
        )}; }\n }\n },\n`;

        // from enum
        result += `\
        /**
         * @private
         */
        _toInt: `;
        result += `function(i${printIfTypescript(
          `: ${node.content.fullyQualifiedName}`
        )})${printIfTypescript(`: number`)} {
          switch (i) {
        `;
        node.content.values.forEach(({ name, value }) => {
          result += `case '${name}': { return ${value}; }\n`;
        });

        result += `// unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
        default: { return i${printIfTypescript(
          ` as unknown as number`
        )}; }\n }\n },\n`;

        result += `} ${printIfTypescript("as const")}${
          isTopLevel ? ";" : ","
        }\n\n`;

        break;
      }
      default: {
        const _exhaust: never = node;
        return _exhaust;
      }
    }
  });
  return result;
}

function writeJSONSerializers(
  types: ProtoTypes[],
  isTopLevel: boolean
): string {
  let result = "";

  types.forEach((node) => {
    result += isTopLevel
      ? `export const ${node.content.name}JSON = {`
      : `${node.content.name}: {`;

    switch (node.type) {
      case "message": {
        const isEmpty = node.content.fields.length === 0;

        if (!node.content.isMap) {
          // encode (json)
          result += `\
          /**
           * Serializes ${node.content.fullyQualifiedName} to JSON.
           */
          `;
          if (isEmpty) {
            result += `encode: function(_msg${printIfTypescript(
              `?: Partial<${node.content.fullyQualifiedName}>`
            )})${printIfTypescript(`: string`)} {
              return "{}";`;
          } else {
            result += `encode: function(msg${printIfTypescript(
              `: Partial<${node.content.fullyQualifiedName}>`
            )})${printIfTypescript(`: string`)} {
              return JSON.stringify(${addJSONSuffixToFullyQualifiedName(
                node.content.fullyQualifiedName
              )}._writeMessage(msg));`;
          }
          result += "},\n\n";

          // decode (json)
          result += `\
      /**
       * Deserializes ${node.content.fullyQualifiedName} from JSON.
       */
      `;
          if (isEmpty) {
            result += `decode: function(_json${printIfTypescript(
              `?: string`
            )})${printIfTypescript(`: ${node.content.fullyQualifiedName}`)} {
          return {};`;
          } else {
            result += `decode: function(json${printIfTypescript(
              `: string`
            )})${printIfTypescript(`: ${node.content.fullyQualifiedName}`)} {
        return ${addJSONSuffixToFullyQualifiedName(
          node.content.fullyQualifiedName
        )}._readMessage(${addJSONSuffixToFullyQualifiedName(
              node.content.fullyQualifiedName
            )}.initialize(), JSON.parse(json));`;
          }
          result += "},\n\n";

          // initialize
          result += `\
          /**
           * Initializes ${
             node.content.fullyQualifiedName
           } with all fields set to their default value.
           */
          initialize: function()${printIfTypescript(
            `: ${node.content.fullyQualifiedName}`
          )} {
            return {
              ${node.content.fields
                .map((field) => {
                  if (field.optional) {
                    return `${field.name}: undefined,`;
                  }
                  if (field.repeated) {
                    return `${field.name}: [],`;
                  } else if (field.read === "readMessage" && !field.map) {
                    return `${field.name}: ${field.tsType}.initialize(),`;
                  } else {
                    return `${field.name}: ${field.defaultValue},`;
                  }
                })
                .join("")}
            };`;
          result += "},\n\n";
        }

        // private: encode (json)
        result += `\
        /**
         * @private
         */
        `;
        if (isEmpty) {
          result += `_writeMessage: function(_msg${printIfTypescript(
            `: ${`Partial<${node.content.fullyQualifiedName}>`}`
          )})${printIfTypescript(`: Record<string, unknown>`)} {
          return {};
        `;
        } else {
          result += `_writeMessage: function(msg${printIfTypescript(
            `: ${`Partial<${node.content.fullyQualifiedName}>`}`
          )})${printIfTypescript(`: Record<string, unknown>`)} {
          const json${printIfTypescript(": Record<string, unknown>")} = {};
          ${node.content.fields
            .map((field) => {
              let res = "";
              let setField = "";
              if (config.json.useProtoFieldName) {
                setField = `json.${field.protoName}`;
              } else {
                setField =
                  // use brackets to protect against unsafe json_name (eg 'foo bar').
                  field.jsonName !== field.name
                    ? `json["${field.jsonName}"]`
                    : `json.${field.name}`;
              }

              if (!config.json.emitFieldsWithDefaultValues) {
                if (field.repeated || field.read === "readBytes") {
                  res += `if (msg.${field.name}?.length) {`;
                } else if (field.optional) {
                  res += `if (msg.${field.name} != undefined) {`;
                } else if (field.read === "readEnum") {
                  res += `if (msg.${
                    field.name
                  } && ${addJSONSuffixToFullyQualifiedName(
                    field.tsType
                  )}._toInt(msg.${field.name})) {`;
                } else {
                  res += `if (msg.${field.name}) {`;
                }
              }

              if (field.read === "readMessage") {
                if (field.repeated) {
                  res += `${setField} = msg.${
                    field.name
                  }.map(${addJSONSuffixToFullyQualifiedName(
                    field.tsType
                  )}._writeMessage)`;
                } else {
                  if (field.map) {
                    res += `const ${field.name} = ${fromMapMessage(
                      `${toMapMessage(
                        `msg.${field.name}`
                      )}.map(${addJSONSuffixToFullyQualifiedName(
                        field.tsType
                      )}._writeMessage)`
                    )};`;
                  } else {
                    res += `const ${
                      field.name
                    } = ${addJSONSuffixToFullyQualifiedName(
                      field.tsType
                    )}._writeMessage(msg.${field.name});`;
                  }
                  if (field.optional) {
                    res += `${setField} = ${field.name};`;
                  } else {
                    res += `if (Object.keys(${field.name}).length > 0) {`;
                    res += `${setField} = ${field.name};`;
                    res += `}`;
                  }
                }
              } else if (field.tsType === "bigint") {
                if (field.repeated) {
                  res += `${setField} = msg.${field.name}.map(x => x.toString());`;
                } else {
                  res += `${setField} = msg.${field.name}.toString();`;
                }
              } else if (field.read === "readBytes") {
                IMPORT_TRACKER.hasBytes = true;
                if (field.repeated) {
                  res += `${setField} = msg.${field.name}.map(encodeBase64Bytes);`;
                } else {
                  res += `${setField} = encodeBase64Bytes(msg.${field.name});`;
                }
              } else {
                res += `${setField} = msg.${field.name};`;
              }

              if (!config.json.emitFieldsWithDefaultValues) {
                res += "}";
              }

              return res;
            })
            .join("\n")}
          return json;`;
        }
        result += "},\n\n";

        // private: decode (json)
        result += `\
        /**
         * @private
         */
        _readMessage: function(msg${printIfTypescript(
          `: ${`${node.content.fullyQualifiedName}`}`
        )}, ${printIf(isEmpty, "_")}json${printIfTypescript(
          `: any`
        )})${printIfTypescript(`: ${`${node.content.fullyQualifiedName}`}`)}{
          ${node.content.fields
            .map((field) => {
              let res = "";
              const name = `_${field.name}`;
              let getField;
              if (
                field.name === field.jsonName &&
                field.name === field.protoName
              ) {
                getField = `json.${field.name}`;
              } else if (field.jsonName !== field.name) {
                getField = `json["${field.jsonName}"] ?? json.${field.protoName}`;
              } else {
                getField = `json.${field.name} ?? json.${field.protoName}`;
              }

              res += `const ${name} = ${getField};`;
              res += `if (${name}) {`;
              if (field.read === "readMessage") {
                if (field.map) {
                  res += `msg.${field.name} = ${fromMapMessage(
                    `${toMapMessage(
                      name
                    )}.map(${addJSONSuffixToFullyQualifiedName(
                      field.tsType
                    )}._readMessage)`
                  )};`;
                } else if (field.repeated) {
                  res += `for (const item of ${name}) {`;
                  res += `const m = ${field.tsType}.initialize();`;
                  res += `${addJSONSuffixToFullyQualifiedName(
                    field.tsType
                  )}._readMessage(m, item);`;
                  res += `msg.${field.name}.push(m);`;
                  res += `}`;
                } else {
                  res += `const m = ${field.tsType}.initialize();`;
                  res += `${addJSONSuffixToFullyQualifiedName(
                    field.tsType
                  )}._readMessage(m, ${name});`;
                  res += `msg.${field.name} = m;`;
                }
              } else if (field.tsType === "bigint") {
                if (field.repeated) {
                  res += `msg.${field.name} = ${name}.map(BigInt);`;
                } else {
                  res += `msg.${field.name} = BigInt(${name});`;
                }
              } else if (field.read === "readBytes") {
                if (field.repeated) {
                  res += `msg.${field.name} = ${name}.map(decodeBase64Bytes);`;
                } else {
                  res += `msg.${field.name} = decodeBase64Bytes(${name});`;
                }
              } else {
                res += `msg.${field.name} = ${name};`;
              }
              res += "}";
              return res;
            })
            .join("\n")}
          return msg;`;
        result += "},\n\n";
        result += writeJSONSerializers(node.children, false);
        result += `}${isTopLevel ? ";" : ","}\n\n`;
        break;
      }

      case "enum": {
        // constant map
        node.content.values.forEach(({ name, comments }) => {
          if (comments?.leading) {
            result += printComments(comments.leading);
          }
          result += `${name}: '${name}',\n`;
        });
        // to enum
        result += `\
        /**
         * @private
         */
        _fromInt: `;
        result += `function(i${printIfTypescript(
          ": number"
        )})${printIfTypescript(`: ${node.content.fullyQualifiedName}`)} {
          switch (i) {
        `;
        node.content.values.forEach(({ name, value }) => {
          result += `case ${value}: { return '${name}'; }\n`;
        });

        result += `// unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
        default: { return i${printIfTypescript(
          ` as unknown as ${node.content.fullyQualifiedName}`
        )}; }\n }\n },\n`;

        // from enum
        result += `\
        /**
         * @private
         */
        _toInt: `;
        result += `function(i${printIfTypescript(
          `: ${node.content.fullyQualifiedName}`
        )})${printIfTypescript(`: number`)} {
          switch (i) {
        `;
        node.content.values.forEach(({ name, value }) => {
          result += `case '${name}': { return ${value}; }\n`;
        });

        result += `// unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
        default: { return i${printIfTypescript(
          ` as unknown as number`
        )}; }\n }\n },\n`;

        result += `} ${printIfTypescript("as const")}${
          isTopLevel ? ";" : ","
        }\n\n`;

        break;
      }
      default: {
        const _exhaust: never = node;
        return _exhaust;
      }
    }
  });
  return result;
}

/**
 * Escapes '*''/' which otherwise would terminate the block comment.
 */
function escapeComment(comment: string): string {
  return comment.replace(/\*\//g, "*" + "\\" + "/");
}

function printComments(comment: string): string {
  const lines = escapeComment(comment).split("\n");
  return `\
    /**
     *${lines.slice(0, -1).join("\n *") + lines.slice(-1).join(" *")}
     */
      `;
}

function addJSONSuffixToFullyQualifiedName(name: string): string {
  const [first, ...rest] = name.split(".");
  return [first + "JSON", ...rest].join(".");
}

export function printHeading(heading: string): string {
  const width = Math.max(40, heading.length + 2);
  const padding = (width - heading.length) / 2;
  return `\
  //${"=".repeat(width)}//
  //${" ".repeat(Math.floor(padding))}${heading}${" ".repeat(
    Math.ceil(padding)
  )}//
  //${"=".repeat(width)}//
  
  `;
}

let config = {
  isTS: false,
  json: {
    emitFieldsWithDefaultValues: false,
    useProtoFieldName: false,
  },
  typescript: {
    emitDeclarationOnly: false,
  },
};

function printIfTypescript(str: string): string {
  return printIf(config.isTS, str);
}

function printIf(cond: boolean, str: string): string {
  return cond ? str : "";
}

export function generate(
  fileDescriptorProto: FileDescriptorProto,
  identifierTable: IdentifierTable,
  options: Pick<UserConfig, "language" | "json" | "typescript">
): string {
  config = {
    isTS: options.language === "typescript",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    json: options.json as any,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    typescript: options.typescript as any,
  };

  IMPORT_TRACKER = { ...DEFAULT_IMPORT_TRACKER };

  const { imports, types } = processTypes(fileDescriptorProto, identifierTable);
  const sourceFile = fileDescriptorProto.getName();
  if (!sourceFile) {
    return "";
  }

  const hasTypes = types.length > 0;
  const hasSerializer =
    !config.typescript.emitDeclarationOnly &&
    !!types.find((x) => x.type === "message");

  const typeDefinitions =
    hasTypes && config.isTS ? writeTypes(types, true) : "";

  const protobufSerializers = !config.typescript.emitDeclarationOnly
    ? writeProtobufSerializers(types, true)
    : "";

  const jsonSerializers = !config.typescript.emitDeclarationOnly
    ? writeJSONSerializers(types, true)
    : "";

  return `\
// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// Source: ${sourceFile}
/* eslint-disable */

${printIf(
  config.isTS && hasSerializer,
  `import type { ByteSource } from 'protoscript';`
)}
${printIf(
  hasSerializer,
  `import {
  ${printIf(hasSerializer, "BinaryReader,\nBinaryWriter,\n")}
  ${printIf(IMPORT_TRACKER.hasBytes, "encodeBase64Bytes,\n")}
  ${printIf(
    IMPORT_TRACKER.hasBytes,
    "decodeBase64Bytes,\n"
  )}} from 'protoscript';`
)}

${imports
  .map(({ identifiers, path }) => {
    const names = identifiers.flatMap((name) => [name, `${name}JSON`]);
    return `import { ${names.join(", ")} } from '${path}';`;
  })
  .join("\n")}

${printIf(
  !!typeDefinitions,
  `${printIfTypescript(printHeading("Types"))}
${typeDefinitions}`
)}
${printIf(
  !!protobufSerializers,
  `${printHeading("Protobuf Encode / Decode")}
${protobufSerializers}
${printHeading("JSON Encode / Decode")}
${jsonSerializers}`
)}
`;
}
