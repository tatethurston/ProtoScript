import { dirname, relative } from "path";
import type { CodeGeneratorRequest } from "google-protobuf/google/protobuf/compiler/plugin_pb.js";
import type {
  DescriptorProto,
  FileDescriptorProto,
  EnumDescriptorProto,
  FieldDescriptorProto as FieldDescriptorProtoType,
} from "google-protobuf/google/protobuf/descriptor_pb.js";
import DescriptorPb from "google-protobuf/google/protobuf/descriptor_pb.js";
import type { BinaryReader, BinaryWriter } from "google-protobuf";
const { FieldDescriptorProto } = DescriptorPb;

export function lowerCase(str: string): string {
  return str[0].toLowerCase() + str.slice(1);
}

function titleCase(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}

function camelCase(segments: string[]): string {
  const [first, ...rest] = segments;
  return first + rest.map(titleCase).join("");
}

export function uniqueBy<T>(arr: T[], cb: (el: T) => unknown): T[] {
  const seen = new Set();
  return arr.filter((x) => {
    const val = cb(x);
    const dup = seen.has(val);
    seen.add(val);
    return !dup;
  });
}

export function cycleDetected(node: string, graph: string[]): boolean {
  return graph.includes(node);
}

const FileLabel = {
  Message: 4,
  Enum: 5,
  Service: 6,
};

const ServiceLabel = {
  Method: 2,
};

const EnumLabel = {
  Value: 2,
};

const MessageLabel = {
  Field: 2,
  Nested: 3,
  Enum: 4,
};

type ReaderMethod = keyof BinaryReader | "map";
type WriterMethod = keyof BinaryWriter | "map";

interface Descriptor {
  defaultValue: string;
  jsonParser: string;
  jsonSerializer: string;
  map: boolean;
  optional: boolean;
  read: ReaderMethod;
  readPacked: ReaderMethod | undefined;
  repeated: boolean;
  tsType: string;
  tsTypeJSON: string;
  write: WriterMethod;
}

export function getDescriptor(
  field: FieldDescriptorProtoType,
  identifierTable: IdentifierTable,
  fileDescriptorProto: FileDescriptorProto,
): Descriptor | undefined {
  const repeated =
    field.getLabel() === FieldDescriptorProto.Label.LABEL_REPEATED;

  const optional = field.hasProto3Optional() || field.hasOneofIndex();

  const _type = field.getType();
  if (!_type) {
    throw new Error("Field has no type");
  }

  switch (_type) {
    case FieldDescriptorProto.Type.TYPE_DOUBLE: {
      return {
        defaultValue: "0",
        jsonSerializer: "identity",
        jsonParser: "protoscript.parseDouble",
        map: false,
        optional,
        read: "readDouble",
        readPacked: "readPackedDouble",
        repeated,
        tsType: "number",
        tsTypeJSON: "number",
        write: repeated ? "writePackedDouble" : "writeDouble",
      };
    }
    case FieldDescriptorProto.Type.TYPE_FLOAT: {
      return {
        defaultValue: "0",
        jsonSerializer: "identity",
        jsonParser: "protoscript.parseDouble",
        map: false,
        optional,
        read: "readFloat",
        readPacked: "readPackedFloat",
        repeated,
        tsType: "number",
        tsTypeJSON: "number",
        write: repeated ? "writePackedFloat" : "writeFloat",
      };
    }
    case FieldDescriptorProto.Type.TYPE_INT64: {
      return {
        defaultValue: "0n",
        jsonSerializer: "String",
        jsonParser: "BigInt",
        map: false,
        optional,
        read: "readInt64String",
        readPacked: "readPackedInt64String",
        repeated,
        tsType: "bigint",
        tsTypeJSON: "bigint",
        write: repeated ? "writePackedInt64String" : "writeInt64String",
      };
    }
    case FieldDescriptorProto.Type.TYPE_UINT64: {
      return {
        defaultValue: "0n",
        jsonSerializer: "String",
        jsonParser: "BigInt",
        map: false,
        optional,
        read: "readUint64String",
        readPacked: "readPackedUint64String",
        repeated,
        tsType: "bigint",
        tsTypeJSON: "bigint",
        write: repeated ? "writePackedUint64String" : "writeUint64String",
      };
    }
    case FieldDescriptorProto.Type.TYPE_INT32: {
      return {
        defaultValue: "0",
        jsonSerializer: "identity",
        jsonParser: "protoscript.parseNumber",
        map: false,
        optional,
        read: "readInt32",
        readPacked: "readPackedInt32",
        repeated,
        tsType: "number",
        tsTypeJSON: "number",
        write: repeated ? "writePackedInt32" : "writeInt32",
      };
    }
    case FieldDescriptorProto.Type.TYPE_FIXED64: {
      return {
        defaultValue: "0n",
        jsonSerializer: "String",
        jsonParser: "BigInt",
        map: false,
        optional,
        read: "readFixed64String",
        readPacked: "readPackedFixed64String",
        repeated,
        tsType: "bigint",
        tsTypeJSON: "bigint",
        write: repeated ? "writePackedFixed64String" : "writeFixed64String",
      };
    }
    case FieldDescriptorProto.Type.TYPE_ENUM: {
      const _type = field.getTypeName() ?? "";
      let name = removePackagePrefix(
        _type,
        identifierTable,
        fileDescriptorProto,
      );
      let jsonName = JSONName(name);
      if (
        !identifierIsDefinedInFile(_type, identifierTable, fileDescriptorProto)
      ) {
        const dep = getIdentifierEntryFromTable(
          _type,
          identifierTable,
          fileDescriptorProto,
        );
        const moduleName = getModuleName(dep);
        name = moduleName + "." + name;
        jsonName = moduleName + "." + jsonName;
      }

      return {
        defaultValue: `${name}._fromInt(0)`,
        jsonSerializer: "identity",
        jsonParser: `${name}._fromInt`,
        map: false,
        optional,
        read: "readEnum",
        readPacked: "readPackedEnum",
        repeated,
        tsType: name,
        tsTypeJSON: jsonName,
        write: repeated ? "writePackedEnum" : "writeEnum",
      };
    }
    case FieldDescriptorProto.Type.TYPE_FIXED32: {
      return {
        defaultValue: "0",
        jsonSerializer: "identity",
        jsonParser: "protoscript.parseNumber",
        map: false,
        optional,
        read: "readFixed32",
        readPacked: "readPackedFixed32",
        repeated,
        tsType: "number",
        tsTypeJSON: "number",
        write: repeated ? "writePackedFixed32" : "writeFixed32",
      };
    }
    case FieldDescriptorProto.Type.TYPE_BOOL: {
      return {
        defaultValue: "false",
        jsonSerializer: "identity",
        jsonParser: "identity",
        map: false,
        optional,
        read: "readBool",
        readPacked: "readPackedBool",
        repeated,
        tsType: "boolean",
        tsTypeJSON: "boolean",
        write: repeated ? "writePackedBool" : "writeBool",
      };
    }
    case FieldDescriptorProto.Type.TYPE_GROUP: {
      const name = field.getName() ?? "";
      console.error(`Groups are not supported. Found group ${name}`);
      return undefined;
    }
    case FieldDescriptorProto.Type.TYPE_MESSAGE: {
      const _type = field.getTypeName() ?? "";
      let name = removePackagePrefix(
        _type,
        identifierTable,
        fileDescriptorProto,
      );
      /* eslint-disable */
      const isMap =
        (
          identifierTable.find(
            ({ namespacedIdentifier }) => _type === namespacedIdentifier,
          )?.descriptorProto as DescriptorProto
        )
          .getOptions()
          ?.getMapEntry() ?? false;
      /* eslint-enable */
      if (isMap) {
        name = name.slice(0, name.lastIndexOf("Entry"));
      }
      let jsonName = JSONName(name);
      if (
        !identifierIsDefinedInFile(_type, identifierTable, fileDescriptorProto)
      ) {
        const dep = getIdentifierEntryFromTable(
          _type,
          identifierTable,
          fileDescriptorProto,
        );
        const moduleName = getModuleName(dep);
        name = moduleName + "." + name;
        jsonName = moduleName + "." + jsonName;
      }

      if (isMap) {
        return {
          defaultValue: "{}",
          jsonSerializer: "identity",
          jsonParser: "identity",
          map: true,
          optional,
          read: "readMessage",
          readPacked: undefined,
          repeated: false,
          tsType: name,
          tsTypeJSON: jsonName,
          write: "writeRepeatedMessage",
        };
      }

      let jsonParser = "identity";
      let jsonSerializer = "identity";
      if (name === "protoscript.Timestamp") {
        jsonParser = "protoscript.parseTimestamp";
        jsonSerializer = "protoscript.serializeTimestamp";
      }
      if (name === "protoscript.Duration") {
        jsonParser = "protoscript.parseDuration";
        jsonSerializer = "protoscript.serializeDuration";
      }

      return {
        defaultValue: "undefined",
        jsonSerializer,
        jsonParser,
        map: false,
        optional,
        read: "readMessage",
        readPacked: undefined,
        repeated,
        tsType: name,
        tsTypeJSON: jsonName,
        write: repeated ? "writeRepeatedMessage" : "writeMessage",
      };
    }
    case FieldDescriptorProto.Type.TYPE_STRING: {
      return {
        defaultValue: "''",
        jsonSerializer: "identity",
        jsonParser: "identity",
        map: false,
        optional,
        read: "readString",
        readPacked: undefined,
        repeated,
        tsType: "string",
        tsTypeJSON: "string",
        write: repeated ? "writeRepeatedString" : "writeString",
      };
    }
    case FieldDescriptorProto.Type.TYPE_BYTES: {
      return {
        defaultValue: "new Uint8Array()",
        jsonSerializer: "protoscript.serializeBytes",
        jsonParser: "protoscript.parseBytes",
        map: false,
        optional,
        read: "readBytes",
        readPacked: undefined,
        repeated,
        tsType: "Uint8Array",
        tsTypeJSON: "Uint8Array",
        write: repeated ? "writeRepeatedBytes" : "writeBytes",
      };
    }
    case FieldDescriptorProto.Type.TYPE_UINT32: {
      return {
        defaultValue: "0",
        jsonSerializer: "identity",
        jsonParser: "protoscript.parseNumber",
        map: false,
        optional,
        read: "readUint32",
        readPacked: "readPackedUint32",
        repeated,
        tsType: "number",
        tsTypeJSON: "number",
        write: repeated ? "writePackedUint32" : "writeUint32",
      };
    }
    case FieldDescriptorProto.Type.TYPE_SFIXED32: {
      return {
        defaultValue: "0",
        jsonSerializer: "identity",
        jsonParser: "protoscript.parseNumber",
        map: false,
        optional,
        read: "readSfixed32",
        readPacked: "readPackedSfixed32",
        repeated,
        tsType: "number",
        tsTypeJSON: "number",
        write: repeated ? "writePackedSfixed32" : "writeSfixed32",
      };
    }
    case FieldDescriptorProto.Type.TYPE_SFIXED64: {
      return {
        defaultValue: "0n",
        jsonSerializer: "String",
        jsonParser: "BigInt",
        map: false,
        optional,
        read: "readSfixed64String",
        readPacked: "readPackedSfixed64String",
        repeated,
        tsType: "bigint",
        tsTypeJSON: "bigint",
        write: repeated ? "writePackedSfixed64String" : "writeSfixed64String",
      };
    }
    case FieldDescriptorProto.Type.TYPE_SINT32: {
      return {
        defaultValue: "0",
        jsonSerializer: "identity",
        jsonParser: "protoscript.parseNumber",
        map: false,
        optional,
        read: "readSint32",
        readPacked: "readPackedSint32",
        repeated,
        tsType: "number",
        tsTypeJSON: "number",
        write: repeated ? "writePackedSint32" : "writeSint32",
      };
    }
    case FieldDescriptorProto.Type.TYPE_SINT64: {
      return {
        defaultValue: "0n",
        jsonSerializer: "String",
        jsonParser: "BigInt",
        map: false,
        optional,
        read: "readSint64String",
        readPacked: "readPackedSint64String",
        repeated,
        tsType: "bigint",
        tsTypeJSON: "bigint",
        write: repeated ? "writePackedSint64String" : "writeSint64String",
      };
    }
    default: {
      const _exhaust: never = _type;
      return _exhaust;
    }
  }
}

function JSONName(name: string): string {
  const [first, ...rest] = name.split(".");
  return [first + "JSON", ...rest].join(".");
}

function stripProtoExtension(protoFileName: string): string {
  return protoFileName.replace(".proto", "");
}

function getProtobufTSFileNameImport(protoFileName: string): string {
  return stripProtoExtension(protoFileName) + ".pb";
}

export function getProtobufTSFileName(protoFileName: string): string {
  return stripProtoExtension(protoFileName) + ".pb.ts";
}

export function getProtobufJSFileName(protoFileName: string): string {
  return stripProtoExtension(protoFileName) + ".pb.js";
}

function getImportPath(importPath: string) {
  return importPath.startsWith("..") ? importPath : `./${importPath}`;
}

export const KNOWN_TYPES = [
  "google/protobuf/any.proto",
  "google/protobuf/api.proto",
  "google/protobuf/descriptor.proto",
  "google/protobuf/duration.proto",
  "google/protobuf/empty.proto",
  "google/protobuf/field_mask.proto",
  "google/protobuf/source_context.proto",
  "google/protobuf/struct.proto",
  "google/protobuf/timestamp.proto",
  "google/protobuf/type.proto",
  "google/protobuf/wrappers.proto",
];

function applyNamespace(
  namespacing: string,
  name: string,
  { removeLeadingPeriod }: { removeLeadingPeriod: boolean } = {
    removeLeadingPeriod: false,
  },
): string {
  let _namespace = namespacing + "." + name;
  if (removeLeadingPeriod && _namespace.startsWith(".")) {
    _namespace = _namespace.slice(1);
  }
  return _namespace;
}

/**
 * [namespacedIdentifier, file, package, publicImport]
 */
export type IdentifierTable = {
  namespacedIdentifier: string;
  file: string;
  package: string;
  publicImport: string | undefined;
  descriptorProto: DescriptorProto | EnumDescriptorProto;
}[];

/**
 * Example
 * '.protobuf_unittest_import.PublicImportMessage', 'google/protobuf/unittest_import_public.proto', 'protobuf_unittest_import', 'protobuf_unittest_import_public'
 */
export function buildIdentifierTable(
  request: CodeGeneratorRequest,
): IdentifierTable {
  const table: IdentifierTable = [];

  request.getProtoFileList().forEach((fileDescriptorProto) => {
    const protoFilePath = fileDescriptorProto.getName();
    if (!protoFilePath) {
      return;
    }

    const _package = fileDescriptorProto.getPackage() ?? "";
    function addEntry(
      namespacing: string,
      name: string,
      descriptorProto: DescriptorProto | EnumDescriptorProto,
    ): void {
      table.push({
        namespacedIdentifier: applyNamespace(namespacing, name),
        file: protoFilePath as string,
        package: _package,
        publicImport: undefined,
        descriptorProto,
      });
    }

    function walk(namespacing: string, descriptorProto: DescriptorProto): void {
      const enums = descriptorProto.getEnumTypeList();
      enums.forEach((enumDescriptorProto) => {
        const enumName = enumDescriptorProto.getName();
        if (enumName) {
          addEntry(namespacing, enumName, enumDescriptorProto);
        }
      });

      const messages = descriptorProto.getNestedTypeList();
      messages.forEach((descriptor) => {
        const messageName = descriptor.getName();
        if (!messageName) {
          return;
        }
        addEntry(namespacing, messageName, descriptor);
        walk(applyNamespace(namespacing, messageName), descriptor);
      });
    }

    const packageName = fileDescriptorProto.getPackage();
    const namespacing = packageName ? "." + packageName : "";

    const enums = fileDescriptorProto.getEnumTypeList();
    enums.forEach((enumDescriptorProto) => {
      const enumName = enumDescriptorProto.getName();
      if (enumName) {
        addEntry(namespacing, enumName, enumDescriptorProto);
      }
    });

    const messages = fileDescriptorProto.getMessageTypeList();
    messages.forEach((descriptorProto) => {
      const messageName = descriptorProto.getName();
      if (!messageName) {
        return;
      }
      addEntry(namespacing, messageName, descriptorProto);
      walk(applyNamespace(namespacing, messageName), descriptorProto);
    });
  });

  request.getProtoFileList().forEach((fileDescriptorProto) => {
    const publicImports = fileDescriptorProto
      .getDependencyList()
      .filter((_, idx) =>
        fileDescriptorProto.getPublicDependencyList().includes(idx),
      );

    const protoFilePath = fileDescriptorProto.getName();
    if (!protoFilePath || publicImports.length === 0) {
      return;
    }

    const forwardedImports = table
      .filter(({ file }) => publicImports.includes(file))
      .map((row) => {
        const newRow: IdentifierTable[0] = { ...row };
        newRow.file = protoFilePath;
        newRow.publicImport = row.file;
        return newRow;
      });

    table.push(...forwardedImports);
  });

  return table;
}

export interface Import {
  identifier: string;
  path: string;
  moduleName: string;
}

interface Comments {
  leading: string | undefined;
  trailing: string | undefined;
}

interface EnumOpts {
  name: string;
  namespacedName: string;
  namespacedNameJSON: string;
  values: {
    name: string;
    value: number;
    comments?: Comments;
  }[];
  comments?: Comments;
}

interface Field extends Descriptor {
  comments?: Comments;
  index: number;
  jsonName: string | undefined;
  name: string;
  protoName: string;
}

interface MessageOpts {
  name: string;
  namespacedName: string;
  namespacedNameJSON: string;
  fields: Field[];
  comments?: Comments;
  isMap: boolean;
}

export type EnumType = { type: "enum"; content: EnumOpts };
export type MessageType = {
  type: "message";
  content: MessageOpts;
  children: ProtoTypes[];
};
export type ProtoTypes = EnumType | MessageType;

export interface Service {
  name: string;
  methods: {
    name: string;
    input: string;
    inputJSON: string;
    output: string;
    outputJSON: string;
    comments?: Comments;
  }[];
  comments?: Comments;
}

export interface ParsedAst {
  packageName: string | undefined;
  imports: {
    identifiers: string[];
    moduleName: string;
    path: string;
  }[];
  types: ProtoTypes[];
  services: Service[];
}

function getIdentifierEntryFromTable(
  identifier: string,
  identifiers: IdentifierTable,
  fileDescriptorProto: FileDescriptorProto,
): IdentifierTable[0] {
  const file = fileDescriptorProto.getName();
  const dependencyFiles = [file].concat(
    fileDescriptorProto.getDependencyList(),
  );

  const dep = identifiers.find(({ namespacedIdentifier, file }) => {
    return (
      namespacedIdentifier === identifier && dependencyFiles.includes(file)
    );
  });

  if (!dep) {
    console.error(identifiers);
    console.error(`Unknown identifier: ${identifier}`);
    throw new Error(`Unknown identifier: ${identifier}`);
  }

  return dep;
}

function getModuleName(dep: IdentifierTable[0]): string {
  const dependencyImportPath = dep.publicImport ?? dep.file;
  if (KNOWN_TYPES.includes(dependencyImportPath)) {
    return "protoscript";
  }
  const mPath = stripProtoExtension(dependencyImportPath).split("/");
  return camelCase(mPath);
}

function getImportForIdentifier(
  identifier: string,
  identifiers: IdentifierTable,
  fileDescriptorProto: FileDescriptorProto,
  isTS: boolean,
): Import {
  const dep = getIdentifierEntryFromTable(
    identifier,
    identifiers,
    fileDescriptorProto,
  );
  const sourceFile = fileDescriptorProto.getName() ?? "";
  const dependencyImportPath = dep.publicImport ?? dep.file;

  const importPath = relative(
    dirname(sourceFile),
    /*
     * When targetting ESM, the TypeScripts compiler expects .js extensions and not .ts extensions because the compiler does not manipulate import paths: https://www.typescriptlang.org/docs/handbook/esm-node.html.
     *
     * Including a full extension results in:
     *
     * [tsserver 2691] [E] An import path cannot end with a '.ts' extension.
     *
     * The TypeScript team's recomendation to use .js extensions for .ts file imports causes a number of issues with the broader JavaScript ecosystem. Until this situation is rectified, do not emit ESM compliant extensions for TypeScript. This only impacts TypeScript users who wish to target ESM in Node.JS. If you're impacted by this, please join the discussion in https://github.com/tatethurston/TwirpScript/issues/202.
     */
    isTS
      ? getProtobufTSFileNameImport(dependencyImportPath)
      : getProtobufJSFileName(dependencyImportPath),
  );

  let path = getImportPath(importPath);
  if (KNOWN_TYPES.includes(dependencyImportPath)) {
    path = "protoscript";
  }
  const moduleName = getModuleName(dep);
  const dependencyIdentifier = identifier.split(".").pop() ?? "";
  return { identifier: dependencyIdentifier, moduleName, path };
}

function identifierIsDefinedInFile(
  identifier: string,
  identifierTable: IdentifierTable,
  fileDescriptorProto: FileDescriptorProto,
): boolean {
  return (
    identifierTable.find(
      ({ namespacedIdentifier, file }) =>
        identifier === namespacedIdentifier &&
        file === fileDescriptorProto.getName(),
    ) !== undefined
  );
}

function removePackagePrefix(
  identifier: string,
  identifiers: IdentifierTable,
  fileDescriptorProto: FileDescriptorProto,
): string {
  const dep = getIdentifierEntryFromTable(
    identifier,
    identifiers,
    fileDescriptorProto,
  );
  const packagePrefix = "." + dep.package;

  let name = identifier;
  if (name.startsWith(packagePrefix)) {
    name = name.slice(packagePrefix.length);
  }
  if (name.startsWith(".")) {
    name = name.slice(1);
  }
  return name;
}

function isNotBlank<T>(x: T): x is NonNullable<T> {
  return x != undefined;
}

export function processTypes(
  fileDescriptorProto: FileDescriptorProto,
  identifierTable: IdentifierTable,
  isTS: boolean,
): ParsedAst {
  const typeFile: ParsedAst = {
    packageName: fileDescriptorProto.getPackage(),
    imports: [],
    services: [],
    types: [],
  };

  function addIdentiferToImports(identifier: string) {
    const _import = getImportForIdentifier(
      identifier,
      identifierTable,
      fileDescriptorProto,
      isTS,
    );
    const exisitingImport = typeFile.imports.find(
      ({ path }) => path === _import.path,
    );
    if (exisitingImport) {
      if (!exisitingImport.identifiers.find((x) => x === _import.identifier)) {
        exisitingImport.identifiers.push(_import.identifier);
      }
    } else {
      typeFile.imports.push({
        identifiers: [_import.identifier],
        moduleName: _import.moduleName,
        path: _import.path,
      });
    }
  }
  function getEnum(namespacing: string, node: EnumDescriptorProto): EnumOpts {
    const name = node.getName();
    if (!name) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Expected name for ${node}`);
    }

    const namespacedName = applyNamespace(namespacing, name, {
      removeLeadingPeriod: true,
    });

    const opts: EnumOpts = {
      name,
      namespacedName,
      namespacedNameJSON: JSONName(namespacedName),
      values: node.getValueList().map((value) => ({
        name: value.getName() ?? "",
        value: value.getNumber() ?? 0,
      })),
    };

    return opts;
  }

  function getMessage(namespacing: string, node: DescriptorProto): MessageOpts {
    let name = node.getName();
    if (!name) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Expected name for ${node}`);
    }

    const isMap = node.getOptions()?.getMapEntry() ?? false;
    name = isMap ? name.slice(0, name.lastIndexOf("Entry")) : name;

    const namespacedName = applyNamespace(namespacing, name, {
      removeLeadingPeriod: true,
    });

    const opts: MessageOpts = {
      name,
      namespacedName,
      namespacedNameJSON: JSONName(namespacedName),
      isMap,
      fields: node
        .getFieldList()
        .map((value) => {
          const descriptor = getDescriptor(
            value,
            identifierTable,
            fileDescriptorProto,
          );
          if (!descriptor) {
            return;
          }
          const _type = value.getType();
          if (
            _type === FieldDescriptorProto.Type.TYPE_MESSAGE ||
            _type === FieldDescriptorProto.Type.TYPE_ENUM
          ) {
            processIdentifier(value.getTypeName() ?? "");
          }
          const nameWithoutUnderscores =
            value.getName()?.split(/_+/).filter(Boolean) ?? [];
          return {
            name: camelCase(nameWithoutUnderscores),
            protoName: value.getName() ?? "",
            jsonName: value.getJsonName(),
            index: value.getNumber() ?? 0,
            ...descriptor,
          };
        })
        .filter(isNotBlank),
    };
    return opts;
  }

  function processIdentifier(identifier: string) {
    if (
      identifierIsDefinedInFile(
        identifier,
        identifierTable,
        fileDescriptorProto,
      )
    ) {
      return;
    }

    addIdentiferToImports(identifier);
  }

  function walk(
    namespacing: string,
    descriptorProto: DescriptorProto,
  ): ProtoTypes[] {
    const types: ProtoTypes[] = [];
    const enums = descriptorProto.getEnumTypeList();
    enums.forEach((enumDescriptorProto) => {
      const enumName = enumDescriptorProto.getName();
      if (enumName) {
        types.push({
          type: "enum",
          content: getEnum(namespacing, enumDescriptorProto),
        });
      }
    });

    const messages = descriptorProto.getNestedTypeList();
    messages.forEach((descriptor) => {
      const messageName = descriptor.getName();
      if (messageName) {
        const children = walk(
          applyNamespace(namespacing, messageName),
          descriptor,
        );
        types.push({
          type: "message",
          content: getMessage(namespacing, descriptor),
          children,
        });
      }
    });

    return types;
  }

  const enums = fileDescriptorProto.getEnumTypeList();
  enums.forEach((enumDescriptorProto) => {
    typeFile.types.push({
      type: "enum",
      content: getEnum("", enumDescriptorProto),
    });
  });

  const messages = fileDescriptorProto.getMessageTypeList();
  messages.forEach((descriptor) => {
    const messageName = descriptor.getName();
    if (messageName) {
      const children = walk(applyNamespace("", messageName), descriptor);
      typeFile.types.push({
        type: "message",
        content: getMessage("", descriptor),
        children,
      });
    }
  });

  typeFile.services = fileDescriptorProto.getServiceList().map((service) => ({
    name: service.getName() ?? "",
    methods: service.getMethodList().map((method) => {
      processIdentifier(method.getInputType() ?? "");
      processIdentifier(method.getOutputType() ?? "");

      const intype = method.getInputType() ?? "";
      let input = removePackagePrefix(
        intype,
        identifierTable,
        fileDescriptorProto,
      );
      let inputJSON = JSONName(input);
      if (
        !identifierIsDefinedInFile(intype, identifierTable, fileDescriptorProto)
      ) {
        const dep = getIdentifierEntryFromTable(
          intype,
          identifierTable,
          fileDescriptorProto,
        );
        const moduleName = getModuleName(dep);
        input = moduleName + "." + input;
        inputJSON = moduleName + "." + inputJSON;
      }

      const outtype = method.getOutputType() ?? "";
      let output = removePackagePrefix(
        outtype,
        identifierTable,
        fileDescriptorProto,
      );
      let outputJSON = JSONName(output);
      if (
        !identifierIsDefinedInFile(
          outtype,
          identifierTable,
          fileDescriptorProto,
        )
      ) {
        const dep = getIdentifierEntryFromTable(
          outtype,
          identifierTable,
          fileDescriptorProto,
        );
        const moduleName = getModuleName(dep);
        output = moduleName + "." + output;
        outputJSON = moduleName + "." + outputJSON;
      }

      return {
        name: method.getName() ?? "",
        input,
        inputJSON,
        output,
        outputJSON,
      };
    }),
  }));

  // add comments
  const comments = fileDescriptorProto
    .getSourceCodeInfo()
    ?.getLocationList()
    .filter((x) => x.hasLeadingComments() || x.hasTrailingComments());

  comments?.forEach((comment) => {
    const content = {
      leading: comment.getLeadingComments(),
      trailing: comment.getTrailingComments(),
    };
    const path = comment.getPathList();
    const first = path.shift();
    let types = typeFile.types;

    function addCommentToEnum() {
      const idx = path.shift();
      if (idx === undefined) {
        return;
      }

      const _enum = types.filter((t) => t.type === "enum")[idx].content;

      // enum comment
      if (path.length === 0) {
        _enum.comments = content;
        // value comment
      } else if (path.shift() === EnumLabel.Value) {
        const valueIdx = path.shift();
        if (valueIdx === undefined) {
          return;
        }

        _enum.values[valueIdx].comments = content;
      }
    }

    function addCommentToMessage() {
      const idx = path.shift();
      if (idx === undefined) {
        return;
      }

      const message = types.filter((t) => t.type === "message")[idx];

      // message comment
      if (path.length === 0) {
        message.content.comments = content;
      } else {
        const next = path.shift();
        if (next === undefined) {
          return;
        }

        if (next === MessageLabel.Field) {
          const fieldIdx = path.shift();
          if (fieldIdx === undefined) {
            return;
          }
          message.content.fields[fieldIdx].comments = content;
        } else if (next === MessageLabel.Enum) {
          types = message.children;
          addCommentToEnum();
        } else if (next === MessageLabel.Nested) {
          types = message.children;
          addCommentToMessage();
        }
      }
    }

    if (first === FileLabel.Enum) {
      addCommentToEnum();
    } else if (first === FileLabel.Service) {
      const idx = path.shift();
      if (idx === undefined) {
        return;
      }

      const service = typeFile.services[idx];

      // service comment
      if (path.length === 0) {
        service.comments = content;
        // method comment
      } else if (path.shift() === ServiceLabel.Method) {
        const methodIdx = path.shift();
        if (methodIdx === undefined) {
          return;
        }

        service.methods[methodIdx].comments = content;
      }
    } else if (first === FileLabel.Message) {
      addCommentToMessage();
    }
  });

  return typeFile;
}
