/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-explicit-any */
import { type FileDescriptorProto } from "google-protobuf/google/protobuf/descriptor_pb.js";
import { type UserConfig } from "../../cli/core.js";
import { type Plugin } from "../../plugin.js";
import {
  IdentifierTable,
  ProtoTypes,
  cycleDetected,
  processTypes,
  uniqueBy,
} from "../utils.js";

const TIMESTAMP = "protoscript.Timestamp";
const DURATION = "protoscript.Duration";
const WELL_KNOWN_TYPES = [TIMESTAMP, DURATION];

function writeTypes(types: ProtoTypes[], parents: string[]): string {
  let result = "";
  const isTopLevel = parents.length === 0;

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
        "export ",
      )}interface ${name} {\n`;
      node.content.fields.forEach(
        ({ name: fieldName, tsType, repeated, optional, comments, map }) => {
          if (comments?.leading) {
            result += printComments(comments.leading);
          }

          const mandatoryOptional = cycleDetected(tsType, [
            ...parents,
            node.content.name,
          ]);

          result += `${fieldName}${printIf(optional, "?")}:`;
          if (map) {
            result += `Record<string, ${tsType}['value'] | undefined>`;
          } else {
            result += tsType;
            if (repeated) {
              result += "[]";
            } else if (optional || mandatoryOptional) {
              result += "| null | undefined";
            }
          }

          result += ";\n";
        },
      );
      result += "}\n\n";

      if (node.children.length > 0) {
        result += `${printIf(
          isTopLevel,
          "export declare",
        )} namespace ${name} { \n`;
        result +=
          writeTypes(node.children, [...parents, node.content.name]) + "\n\n";
        result += `}\n\n`;
      }
    }
  });

  return result;
}

const toMapMessage = (name: string) =>
  `Object.entries(${name}).map(([key, value]) => ({ key: key ${printIfTypescript(
    "as any",
  )}, value: value ${printIfTypescript("as any")} }))`;

const fromMapMessage = (x: string) =>
  `Object.fromEntries(${x}.map(({ key, value }) => [key, value]))`;

function writeProtobufSerializers(
  types: ProtoTypes[],
  parents: string[],
): string {
  let result = "";
  const isTopLevel = parents.length === 0;

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
           * Serializes ${node.content.namespacedName} to protobuf.
           */
            `;
          if (isEmpty) {
            result += `encode: function(_msg${printIfTypescript(
              `?: PartialDeep<${node.content.namespacedName}>`,
            )})${printIfTypescript(`: Uint8Array`)} {
              return new Uint8Array();`;
          } else {
            result += `encode: function(msg${printIfTypescript(
              `: PartialDeep<${node.content.namespacedName}>`,
            )})${printIfTypescript(`: Uint8Array`)} {
            return ${
              node.content.namespacedName
            }._writeMessage(msg, new protoscript.BinaryWriter()).getResultBuffer();`;
          }
          result += "},\n\n";

          // decode (protobuf)
          result += `\
          /**
           * Deserializes ${node.content.namespacedName} from protobuf.
           */
          `;
          if (isEmpty) {
            result += `decode: function(_bytes${printIfTypescript(
              `?: ByteSource`,
            )})${printIfTypescript(`: ${node.content.namespacedName}`)} {
              return {};`;
          } else {
            result += `decode: function(bytes${printIfTypescript(
              `: ByteSource`,
            )})${printIfTypescript(`: ${node.content.namespacedName}`)} {
            return ${node.content.namespacedName}._readMessage(${
              node.content.namespacedName
            }.initialize(), new protoscript.BinaryReader(bytes));`;
          }
          result += "},\n\n";

          // initialize
          result += `\
          /**
           * Initializes ${
             node.content.namespacedName
           } with all fields set to their default value.
           */
          initialize: function()${printIfTypescript(
            `: ${node.content.namespacedName}`,
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
                    if (
                      cycleDetected(field.tsType, [
                        ...parents,
                        node.content.name,
                      ])
                    ) {
                      return `${field.name}: undefined,`;
                    } else {
                      return `${field.name}: ${field.tsType}.initialize(),`;
                    }
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
          `: ${`PartialDeep<${node.content.namespacedName}>`}`,
        )}, writer${printIfTypescript(
          `: protoscript.BinaryWriter`,
        )})${printIfTypescript(`: protoscript.BinaryWriter`)} {
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
                      "as any",
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
            `: ${`${node.content.namespacedName}`}`,
          )}, _reader${printIfTypescript(
            `: protoscript.BinaryReader`,
          )})${printIfTypescript(`: ${`${node.content.namespacedName}`}`)}{
            return _msg;`;
        } else {
          result += `_readMessage: function(msg${printIfTypescript(
            `: ${`${node.content.namespacedName}`}`,
          )}, reader${printIfTypescript(
            `: protoscript.BinaryReader`,
          )})${printIfTypescript(`: ${`${node.content.namespacedName}`}`)}{
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
                          ` as ${field.tsType}`,
                        )};
                        reader.readMessage(map, ${field.tsType}._readMessage);
                        msg.${field.name}[map.key${printIf(
                          field.tsType !== "string",
                          ".toString()",
                        )}] = map.value;
                      `;
                      } else if (field.repeated) {
                        res += `const m = ${field.tsType}.initialize();`;
                        res += `reader.readMessage(m, ${field.tsType}._readMessage);`;
                        res += `msg.${field.name}.push(m);`;
                      } else {
                        if (
                          field.optional ||
                          node.content.isMap ||
                          cycleDetected(field.tsType, [
                            ...parents,
                            node.content.name,
                          ])
                        ) {
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
        result += writeProtobufSerializers(node.children, [
          ...parents,
          node.content.name,
        ]);
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
          ": number",
        )})${printIfTypescript(`: ${node.content.namespacedName}`)} {
          switch (i) {
        `;
        // Though all alias values are valid during deserialization, the first value is always used when serializing
        // https://protobuf.dev/programming-guides/proto3/#enum
        uniqueBy(node.content.values, (x) => x.value).forEach(
          ({ name, value }) => {
            result += `case ${value}: { return '${name}'; }\n`;
          },
        );

        result += `// unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
        default: { return i${printIfTypescript(
          ` as unknown as ${node.content.namespacedName}`,
        )}; }\n }\n },\n`;

        // from enum
        result += `\
        /**
         * @private
         */
        _toInt: `;
        result += `function(i${printIfTypescript(
          `: ${node.content.namespacedName}`,
        )})${printIfTypescript(`: number`)} {
          switch (i) {
        `;
        node.content.values.forEach(({ name, value }) => {
          result += `case '${name}': { return ${value}; }\n`;
        });

        result += `// unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
        default: { return i${printIfTypescript(
          ` as unknown as number`,
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

function writeJSONSerializers(types: ProtoTypes[], parents: string[]): string {
  let result = "";
  const isTopLevel = parents.length === 0;

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
           * Serializes ${node.content.namespacedName} to JSON.
           */
          `;
          if (isEmpty) {
            result += `encode: function(_msg${printIfTypescript(
              `?: PartialDeep<${node.content.namespacedName}>`,
            )})${printIfTypescript(`: string`)} {
              return "{}";`;
          } else {
            result += `encode: function(msg${printIfTypescript(
              `: PartialDeep<${node.content.namespacedName}>`,
            )})${printIfTypescript(`: string`)} {
              return JSON.stringify(${
                node.content.namespacedNameJSON
              }._writeMessage(msg));`;
          }
          result += "},\n\n";

          // decode (json)
          result += `\
      /**
       * Deserializes ${node.content.namespacedName} from JSON.
       */
      `;
          if (isEmpty) {
            result += `decode: function(_json${printIfTypescript(
              `?: string`,
            )})${printIfTypescript(`: ${node.content.namespacedName}`)} {
          return {};`;
          } else {
            result += `decode: function(json${printIfTypescript(
              `: string`,
            )})${printIfTypescript(`: ${node.content.namespacedName}`)} {
        return ${node.content.namespacedNameJSON}._readMessage(${
          node.content.namespacedNameJSON
        }.initialize(), JSON.parse(json));`;
          }
          result += "},\n\n";

          // initialize
          result += `\
          /**
           * Initializes ${
             node.content.namespacedName
           } with all fields set to their default value.
           */
          initialize: function()${printIfTypescript(
            `: ${node.content.namespacedName}`,
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
                    if (
                      cycleDetected(field.tsType, [
                        ...parents,
                        node.content.name,
                      ])
                    ) {
                      return `${field.name}: undefined,`;
                    } else {
                      return `${field.name}: ${field.tsTypeJSON}.initialize(),`;
                    }
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
            `: ${`PartialDeep<${node.content.namespacedName}>`}`,
          )})${printIfTypescript(`: Record<string, unknown>`)} {
          return {};
        `;
        } else {
          result += `_writeMessage: function(msg${printIfTypescript(
            `: ${`PartialDeep<${node.content.namespacedName}>`}`,
          )})${printIfTypescript(`: Record<string, unknown>`)} {
          const json${printIfTypescript(": Record<string, unknown>")} = {};
          ${node.content.fields
            .map((field) => {
              let res = "";
              const setField = config.json.useProtoFieldName
                ? `json["${field.protoName}"]`
                : `json["${field.jsonName}"]`;

              if (!config.json.emitFieldsWithDefaultValues) {
                if (field.repeated || field.read === "readBytes") {
                  res += `if (msg.${field.name}?.length) {`;
                } else if (field.optional) {
                  res += `if (msg.${field.name} != undefined) {`;
                } else if (field.read === "readEnum") {
                  res += `if (msg.${field.name} && ${field.tsTypeJSON}._toInt(msg.${field.name})) {`;
                } else if ([DURATION, TIMESTAMP].includes(field.tsType)) {
                  res += `if (msg.${field.name} && msg.${field.name}.seconds && msg.${field.name}.nanos) {`;
                } else {
                  res += `if (msg.${field.name}) {`;
                }
              }

              if (
                field.read === "readMessage" &&
                !WELL_KNOWN_TYPES.includes(field.tsType)
              ) {
                if (field.repeated) {
                  res += `${setField} = msg.${field.name}.map(${field.tsTypeJSON}._writeMessage)`;
                } else {
                  const name = `_${field.name}_`;
                  if (field.map) {
                    res += `const ${name} = ${fromMapMessage(
                      `${toMapMessage(`msg.${field.name}`)}.map(${
                        field.tsTypeJSON
                      }._writeMessage)`,
                    )};`;
                  } else {
                    res += `const ${name} = ${field.tsTypeJSON}._writeMessage(msg.${field.name});`;
                  }
                  if (field.optional) {
                    res += `${setField} = ${name};`;
                  } else {
                    res += `if (Object.keys(${name}).length > 0) {`;
                    res += `${setField} = ${name};`;
                    res += `}`;
                  }
                }
              } else {
                let serializer: string;
                switch (field.read) {
                  case "readEnum":
                  case "readBool":
                  case "readString": {
                    serializer = "identity";
                    break;
                  }
                  case "readBytes": {
                    serializer = "protoscript.serializeBytes";
                    break;
                  }
                  case "readInt32":
                  case "readFixed32":
                  case "readUint32": {
                    serializer = "identity";
                    break;
                  }
                  case "readInt64String":
                  case "readFixed64String":
                  case "readUint64String": {
                    serializer = "String";
                    break;
                  }
                  case "readFloat":
                  case "readDouble": {
                    serializer = "identity";
                    break;
                  }
                  case "readMessage": {
                    switch (field.tsType) {
                      case TIMESTAMP: {
                        serializer = "protoscript.serializeTimestamp";
                        break;
                      }
                      case DURATION: {
                        serializer = "protoscript.serializeDuration";
                        break;
                      }
                      default: {
                        serializer = "identity";
                        break;
                      }
                    }
                    break;
                  }
                  default: {
                    serializer = "identity";
                    break;
                  }
                }

                if (serializer === "identity") {
                  res += `${setField} = msg.${field.name};`;
                } else {
                  if (field.repeated) {
                    res += `${setField} = msg.${field.name}.map(${serializer});`;
                  } else {
                    res += `${setField} = ${serializer}(msg.${field.name});`;
                  }
                }
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
          `: ${`${node.content.namespacedName}`}`,
        )}, ${printIf(isEmpty, "_")}json${printIfTypescript(
          `: any`,
        )})${printIfTypescript(`: ${`${node.content.namespacedName}`}`)}{
          ${node.content.fields
            .map((field) => {
              let res = "";
              const name = `_${field.name}_`;
              const getField = [
                `json["${field.jsonName}"]`,
                field.name !== field.jsonName && `json["${field.name}"]`,
                field.protoName !== field.name && `json["${field.protoName}"]`,
              ]
                .filter(Boolean)
                .join(" ?? ");

              res += `const ${name} = ${getField};`;
              res += `if (${name}) {`;

              if (
                field.read === "readMessage" &&
                !WELL_KNOWN_TYPES.includes(field.tsType)
              ) {
                if (field.map) {
                  res += `msg.${field.name} = ${fromMapMessage(
                    `${toMapMessage(name)}.map(${
                      field.tsTypeJSON
                    }._readMessage)`,
                  )};`;
                } else if (field.repeated) {
                  res += `for (const item of ${name}) {`;
                  res += `const m = ${field.tsTypeJSON}.initialize();`;
                  res += `${field.tsTypeJSON}._readMessage(m, item);`;
                  res += `msg.${field.name}.push(m);`;
                  res += `}`;
                } else {
                  if (
                    field.optional ||
                    cycleDetected(field.tsType, [...parents, node.content.name])
                  ) {
                    res += `msg.${field.name} = ${field.tsTypeJSON}.initialize();`;
                  }
                  res += `${field.tsTypeJSON}._readMessage(msg.${field.name}, ${name});`;
                }
              } else {
                let parser: string;
                switch (field.read) {
                  case "readEnum": {
                    parser = `${field.tsType}._fromInt`;
                    break;
                  }
                  case "readBool":
                  case "readString": {
                    parser = "identity";
                    break;
                  }
                  case "readBytes": {
                    parser = "protoscript.parseBytes";
                    break;
                  }
                  case "readInt32":
                  case "readFixed32":
                  case "readUint32": {
                    parser = "protoscript.parseNumber";
                    break;
                  }
                  case "readInt64String":
                  case "readFixed64String":
                  case "readUint64String": {
                    parser = "BigInt";
                    break;
                  }
                  case "readFloat":
                  case "readDouble": {
                    parser = "protoscript.parseDouble";
                    break;
                  }
                  case "readMessage": {
                    switch (field.tsType) {
                      case TIMESTAMP: {
                        parser = "protoscript.parseTimestamp";
                        break;
                      }
                      case DURATION: {
                        parser = "protoscript.parseDuration";
                        break;
                      }
                      default: {
                        parser = "identity";
                        break;
                      }
                    }
                    break;
                  }
                  default: {
                    parser = "identity";
                    break;
                  }
                }
                if (parser === "identity") {
                  res += `msg.${field.name} = ${name};`;
                } else {
                  if (field.repeated) {
                    res += `msg.${field.name} = ${name}.map(${parser});`;
                  } else {
                    res += `msg.${field.name} = ${parser}(${name});`;
                  }
                }
              }
              res += "}";
              return res;
            })
            .join("\n")}
          return msg;`;
        result += "},\n\n";
        result += writeJSONSerializers(node.children, [
          ...parents,
          node.content.name,
        ]);
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
          ": number",
        )})${printIfTypescript(`: ${node.content.namespacedName}`)} {
          switch (i) {
        `;
        // Though all alias values are valid during deserialization, the first value is always used when serializing
        // https://protobuf.dev/programming-guides/proto3/#enum
        uniqueBy(node.content.values, (x) => x.value).forEach(
          ({ name, value }) => {
            result += `case ${value}: { return '${name}'; }\n`;
          },
        );

        result += `// unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
        default: { return i${printIfTypescript(
          ` as unknown as ${node.content.namespacedName}`,
        )}; }\n }\n },\n`;

        // from enum
        result += `\
        /**
         * @private
         */
        _toInt: `;
        result += `function(i${printIfTypescript(
          `: ${node.content.namespacedName}`,
        )})${printIfTypescript(`: number`)} {
          switch (i) {
        `;
        node.content.values.forEach(({ name, value }) => {
          result += `case '${name}': { return ${value}; }\n`;
        });

        result += `// unknown values are preserved as numbers. this occurs when new enum values are introduced and the generated code is out of date.
        default: { return i${printIfTypescript(
          ` as unknown as number`,
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

export function printComments(comment: string): string {
  const lines = escapeComment(comment).split("\n");
  return `\
    /**
     *${lines.slice(0, -1).join("\n *") + lines.slice(-1).join(" *")}
     */
      `;
}

export function printHeading(heading: string): string {
  const width = Math.max(40, heading.length + 2);
  const padding = (width - heading.length) / 2;
  return `\
  //${"=".repeat(width)}//
  //${" ".repeat(Math.floor(padding))}${heading}${" ".repeat(
    Math.ceil(padding),
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

export type Config = typeof config;

export function printIfTypescript(str: string): string {
  return printIf(config.isTS, str);
}

function printIf(cond: boolean, str: string): string {
  return cond ? str : "";
}

export function generate(
  fileDescriptorProto: FileDescriptorProto,
  identifierTable: IdentifierTable,
  options: Pick<UserConfig, "language" | "json" | "typescript">,
  plugins: Plugin[],
): string {
  config = {
    isTS: options.language === "typescript",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    json: options.json as any,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    typescript: options.typescript as any,
  };

  const ast = processTypes(fileDescriptorProto, identifierTable, config.isTS);
  const { imports, types } = ast;
  const sourceFile = fileDescriptorProto.getName();
  if (!sourceFile) {
    return "";
  }

  const plugs = plugins.map((plugin) => plugin({ ast, config }));
  const pluginImports = plugs.map((p) => p?.imports).filter(Boolean);
  const pluginServices = plugs.map((p) => p?.services).filter(Boolean);

  const hasTypes = types.length > 0;
  const hasSerializer =
    !config.typescript.emitDeclarationOnly &&
    !!types.find((x) => x.type === "message");

  const typeDefinitions = hasTypes && config.isTS ? writeTypes(types, []) : "";

  const protobufSerializers = !config.typescript.emitDeclarationOnly
    ? writeProtobufSerializers(types, [])
    : "";

  const jsonSerializers = !config.typescript.emitDeclarationOnly
    ? writeJSONSerializers(types, [])
    : "";

  return `\
// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// Source: ${sourceFile}
/* eslint-disable */

${printIf(
  config.isTS && hasSerializer,
  `import type { ByteSource, PartialDeep } from "protoscript";`,
)}
${printIf(hasSerializer, `import * as protoscript from "protoscript";`)}
${printIf(pluginImports.length > 0, pluginImports.join("\n"))}
${imports
  .filter(({ moduleName }) => moduleName !== "protoscript")
  .map(({ moduleName, path }) => {
    return `import * as ${moduleName} from '${path}';`;
  })
  .join("\n")}

${printIf(
  !!typeDefinitions,
  `${printIfTypescript(printHeading("Types"))}
${typeDefinitions}`,
)}
${printIf(pluginServices.length > 0, pluginServices.join("\n"))}
${printIf(
  !!protobufSerializers,
  `${printHeading("Protobuf Encode / Decode")}
${protobufSerializers}
${printHeading("JSON Encode / Decode")}
${jsonSerializers}`,
)}
`;
}
