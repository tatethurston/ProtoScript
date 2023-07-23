// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
// Source: google/protobuf/api.proto
/* eslint-disable */

import type { ByteSource, PartialDeep } from "protoscript";
import { BinaryReader, BinaryWriter } from "protoscript";

import * as protoscript from "protoscript";

//========================================//
//                 Types                  //
//========================================//

/**
 * Api is a light-weight descriptor for an API Interface.
 *
 * Interfaces are also described as "protocol buffer services" in some contexts,
 * such as by the "service" keyword in a .proto file, but they are different
 * from API Services, which represent a concrete implementation of an interface
 * as opposed to simply a description of methods and bindings. They are also
 * sometimes simply referred to as "APIs" in other contexts, such as the name of
 * this message itself. See https://cloud.google.com/apis/design/glossary for
 * detailed terminology.
 */
export interface Api {
  /**
   * The fully qualified name of this interface, including package name
   * followed by the interface's simple name.
   */
  name: string;
  /**
   * The methods of this interface, in unspecified order.
   */
  methods: Method[];
  /**
   * Any metadata attached to the interface.
   */
  options: protoscript.Option[];
  /**
   * A version string for this interface. If specified, must have the form
   * `major-version.minor-version`, as in `1.10`. If the minor version is
   * omitted, it defaults to zero. If the entire version field is empty, the
   * major version is derived from the package name, as outlined below. If the
   * field is not empty, the version in the package name will be verified to be
   * consistent with what is provided here.
   *
   * The versioning schema uses [semantic
   * versioning](http://semver.org) where the major version number
   * indicates a breaking change and the minor version an additive,
   * non-breaking change. Both version numbers are signals to users
   * what to expect from different versions, and should be carefully
   * chosen based on the product plan.
   *
   * The major version is also reflected in the package name of the
   * interface, which must end in `v<major-version>`, as in
   * `google.feature.v1`. For major versions 0 and 1, the suffix can
   * be omitted. Zero major versions must only be used for
   * experimental, non-GA interfaces.
   *
   */
  version: string;
  /**
   * Source context for the protocol buffer service represented by this
   * message.
   */
  sourceContext: protoscript.SourceContext;
  /**
   * Included interfaces. See [Mixin][].
   */
  mixins: Mixin[];
  /**
   * The source syntax of the service.
   */
  syntax: protoscript.Syntax;
}

/**
 * Method represents a method of an API interface.
 */
export interface Method {
  /**
   * The simple name of this method.
   */
  name: string;
  /**
   * A URL of the input message type.
   */
  requestTypeUrl: string;
  /**
   * If true, the request is streamed.
   */
  requestStreaming: boolean;
  /**
   * The URL of the output message type.
   */
  responseTypeUrl: string;
  /**
   * If true, the response is streamed.
   */
  responseStreaming: boolean;
  /**
   * Any metadata attached to the method.
   */
  options: protoscript.Option[];
  /**
   * The source syntax of this method.
   */
  syntax: protoscript.Syntax;
}

/**
 * Declares an API Interface to be included in this interface. The including
 * interface must redeclare all the methods from the included interface, but
 * documentation and options are inherited as follows:
 *
 * - If after comment and whitespace stripping, the documentation
 *   string of the redeclared method is empty, it will be inherited
 *   from the original method.
 *
 * - Each annotation belonging to the service config (http,
 *   visibility) which is not set in the redeclared method will be
 *   inherited.
 *
 * - If an http annotation is inherited, the path pattern will be
 *   modified as follows. Any version prefix will be replaced by the
 *   version of the including interface plus the [root][] path if
 *   specified.
 *
 * Example of a simple mixin:
 *
 *     package google.acl.v1;
 *     service AccessControl {
 *       // Get the underlying ACL object.
 *       rpc GetAcl(GetAclRequest) returns (Acl) {
 *         option (google.api.http).get = "/v1/{resource=**}:getAcl";
 *       }
 *     }
 *
 *     package google.storage.v2;
 *     service Storage {
 *       rpc GetAcl(GetAclRequest) returns (Acl);
 *
 *       // Get a data record.
 *       rpc GetData(GetDataRequest) returns (Data) {
 *         option (google.api.http).get = "/v2/{resource=**}";
 *       }
 *     }
 *
 * Example of a mixin configuration:
 *
 *     apis:
 *     - name: google.storage.v2.Storage
 *       mixins:
 *       - name: google.acl.v1.AccessControl
 *
 * The mixin construct implies that all methods in `AccessControl` are
 * also declared with same name and request/response types in
 * `Storage`. A documentation generator or annotation processor will
 * see the effective `Storage.GetAcl` method after inherting
 * documentation and annotations as follows:
 *
 *     service Storage {
 *       // Get the underlying ACL object.
 *       rpc GetAcl(GetAclRequest) returns (Acl) {
 *         option (google.api.http).get = "/v2/{resource=**}:getAcl";
 *       }
 *       ...
 *     }
 *
 * Note how the version in the path pattern changed from `v1` to `v2`.
 *
 * If the `root` field in the mixin is specified, it should be a
 * relative path under which inherited HTTP paths are placed. Example:
 *
 *     apis:
 *     - name: google.storage.v2.Storage
 *       mixins:
 *       - name: google.acl.v1.AccessControl
 *         root: acls
 *
 * This implies the following inherited HTTP annotation:
 *
 *     service Storage {
 *       // Get the underlying ACL object.
 *       rpc GetAcl(GetAclRequest) returns (Acl) {
 *         option (google.api.http).get = "/v2/acls/{resource=**}:getAcl";
 *       }
 *       ...
 *     }
 */
export interface Mixin {
  /**
   * The fully qualified name of the interface which is included.
   */
  name: string;
  /**
   * If non-empty specifies a path under which inherited HTTP paths
   * are rooted.
   */
  root: string;
}

//========================================//
//        Protobuf Encode / Decode        //
//========================================//

export const Api = {
  /**
   * Serializes Api to protobuf.
   */
  encode: function (msg: PartialDeep<Api>): Uint8Array {
    return Api._writeMessage(msg, new BinaryWriter()).getResultBuffer();
  },

  /**
   * Deserializes Api from protobuf.
   */
  decode: function (bytes: ByteSource): Api {
    return Api._readMessage(Api.initialize(), new BinaryReader(bytes));
  },

  /**
   * Initializes Api with all fields set to their default value.
   */
  initialize: function (): Api {
    return {
      name: "",
      methods: [],
      options: [],
      version: "",
      sourceContext: protoscript.SourceContext.initialize(),
      mixins: [],
      syntax: protoscript.Syntax._fromInt(0),
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<Api>,
    writer: BinaryWriter,
  ): BinaryWriter {
    if (msg.name) {
      writer.writeString(1, msg.name);
    }
    if (msg.methods?.length) {
      writer.writeRepeatedMessage(2, msg.methods as any, Method._writeMessage);
    }
    if (msg.options?.length) {
      writer.writeRepeatedMessage(
        3,
        msg.options as any,
        protoscript.Option._writeMessage,
      );
    }
    if (msg.version) {
      writer.writeString(4, msg.version);
    }
    if (msg.sourceContext) {
      writer.writeMessage(
        5,
        msg.sourceContext,
        protoscript.SourceContext._writeMessage,
      );
    }
    if (msg.mixins?.length) {
      writer.writeRepeatedMessage(6, msg.mixins as any, Mixin._writeMessage);
    }
    if (msg.syntax && protoscript.Syntax._toInt(msg.syntax)) {
      writer.writeEnum(7, protoscript.Syntax._toInt(msg.syntax));
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Api, reader: BinaryReader): Api {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          msg.name = reader.readString();
          break;
        }
        case 2: {
          const m = Method.initialize();
          reader.readMessage(m, Method._readMessage);
          msg.methods.push(m);
          break;
        }
        case 3: {
          const m = protoscript.Option.initialize();
          reader.readMessage(m, protoscript.Option._readMessage);
          msg.options.push(m);
          break;
        }
        case 4: {
          msg.version = reader.readString();
          break;
        }
        case 5: {
          reader.readMessage(
            msg.sourceContext,
            protoscript.SourceContext._readMessage,
          );
          break;
        }
        case 6: {
          const m = Mixin.initialize();
          reader.readMessage(m, Mixin._readMessage);
          msg.mixins.push(m);
          break;
        }
        case 7: {
          msg.syntax = protoscript.Syntax._fromInt(reader.readEnum());
          break;
        }
        default: {
          reader.skipField();
          break;
        }
      }
    }
    return msg;
  },
};

export const Method = {
  /**
   * Serializes Method to protobuf.
   */
  encode: function (msg: PartialDeep<Method>): Uint8Array {
    return Method._writeMessage(msg, new BinaryWriter()).getResultBuffer();
  },

  /**
   * Deserializes Method from protobuf.
   */
  decode: function (bytes: ByteSource): Method {
    return Method._readMessage(Method.initialize(), new BinaryReader(bytes));
  },

  /**
   * Initializes Method with all fields set to their default value.
   */
  initialize: function (): Method {
    return {
      name: "",
      requestTypeUrl: "",
      requestStreaming: false,
      responseTypeUrl: "",
      responseStreaming: false,
      options: [],
      syntax: protoscript.Syntax._fromInt(0),
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<Method>,
    writer: BinaryWriter,
  ): BinaryWriter {
    if (msg.name) {
      writer.writeString(1, msg.name);
    }
    if (msg.requestTypeUrl) {
      writer.writeString(2, msg.requestTypeUrl);
    }
    if (msg.requestStreaming) {
      writer.writeBool(3, msg.requestStreaming);
    }
    if (msg.responseTypeUrl) {
      writer.writeString(4, msg.responseTypeUrl);
    }
    if (msg.responseStreaming) {
      writer.writeBool(5, msg.responseStreaming);
    }
    if (msg.options?.length) {
      writer.writeRepeatedMessage(
        6,
        msg.options as any,
        protoscript.Option._writeMessage,
      );
    }
    if (msg.syntax && protoscript.Syntax._toInt(msg.syntax)) {
      writer.writeEnum(7, protoscript.Syntax._toInt(msg.syntax));
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Method, reader: BinaryReader): Method {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          msg.name = reader.readString();
          break;
        }
        case 2: {
          msg.requestTypeUrl = reader.readString();
          break;
        }
        case 3: {
          msg.requestStreaming = reader.readBool();
          break;
        }
        case 4: {
          msg.responseTypeUrl = reader.readString();
          break;
        }
        case 5: {
          msg.responseStreaming = reader.readBool();
          break;
        }
        case 6: {
          const m = protoscript.Option.initialize();
          reader.readMessage(m, protoscript.Option._readMessage);
          msg.options.push(m);
          break;
        }
        case 7: {
          msg.syntax = protoscript.Syntax._fromInt(reader.readEnum());
          break;
        }
        default: {
          reader.skipField();
          break;
        }
      }
    }
    return msg;
  },
};

export const Mixin = {
  /**
   * Serializes Mixin to protobuf.
   */
  encode: function (msg: PartialDeep<Mixin>): Uint8Array {
    return Mixin._writeMessage(msg, new BinaryWriter()).getResultBuffer();
  },

  /**
   * Deserializes Mixin from protobuf.
   */
  decode: function (bytes: ByteSource): Mixin {
    return Mixin._readMessage(Mixin.initialize(), new BinaryReader(bytes));
  },

  /**
   * Initializes Mixin with all fields set to their default value.
   */
  initialize: function (): Mixin {
    return {
      name: "",
      root: "",
    };
  },

  /**
   * @private
   */
  _writeMessage: function (
    msg: PartialDeep<Mixin>,
    writer: BinaryWriter,
  ): BinaryWriter {
    if (msg.name) {
      writer.writeString(1, msg.name);
    }
    if (msg.root) {
      writer.writeString(2, msg.root);
    }
    return writer;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Mixin, reader: BinaryReader): Mixin {
    while (reader.nextField()) {
      const field = reader.getFieldNumber();
      switch (field) {
        case 1: {
          msg.name = reader.readString();
          break;
        }
        case 2: {
          msg.root = reader.readString();
          break;
        }
        default: {
          reader.skipField();
          break;
        }
      }
    }
    return msg;
  },
};

//========================================//
//          JSON Encode / Decode          //
//========================================//

export const ApiJSON = {
  /**
   * Serializes Api to JSON.
   */
  encode: function (msg: PartialDeep<Api>): string {
    return JSON.stringify(ApiJSON._writeMessage(msg));
  },

  /**
   * Deserializes Api from JSON.
   */
  decode: function (json: string): Api {
    return ApiJSON._readMessage(ApiJSON.initialize(), JSON.parse(json));
  },

  /**
   * Initializes Api with all fields set to their default value.
   */
  initialize: function (): Api {
    return {
      name: "",
      methods: [],
      options: [],
      version: "",
      sourceContext: protoscript.SourceContextJSON.initialize(),
      mixins: [],
      syntax: protoscript.Syntax._fromInt(0),
    };
  },

  /**
   * @private
   */
  _writeMessage: function (msg: PartialDeep<Api>): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.name) {
      json["name"] = msg.name;
    }
    if (msg.methods?.length) {
      json["methods"] = msg.methods.map(MethodJSON._writeMessage);
    }
    if (msg.options?.length) {
      json["options"] = msg.options.map(protoscript.OptionJSON._writeMessage);
    }
    if (msg.version) {
      json["version"] = msg.version;
    }
    if (msg.sourceContext) {
      const _sourceContext_ = protoscript.SourceContextJSON._writeMessage(
        msg.sourceContext,
      );
      if (Object.keys(_sourceContext_).length > 0) {
        json["sourceContext"] = _sourceContext_;
      }
    }
    if (msg.mixins?.length) {
      json["mixins"] = msg.mixins.map(MixinJSON._writeMessage);
    }
    if (msg.syntax && protoscript.SyntaxJSON._toInt(msg.syntax)) {
      json["syntax"] = msg.syntax;
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Api, json: any): Api {
    const _name_ = json["name"];
    if (_name_) {
      msg.name = _name_;
    }
    const _methods_ = json["methods"];
    if (_methods_) {
      for (const item of _methods_) {
        const m = MethodJSON.initialize();
        MethodJSON._readMessage(m, item);
        msg.methods.push(m);
      }
    }
    const _options_ = json["options"];
    if (_options_) {
      for (const item of _options_) {
        const m = protoscript.OptionJSON.initialize();
        protoscript.OptionJSON._readMessage(m, item);
        msg.options.push(m);
      }
    }
    const _version_ = json["version"];
    if (_version_) {
      msg.version = _version_;
    }
    const _sourceContext_ = json["sourceContext"] ?? json["source_context"];
    if (_sourceContext_) {
      protoscript.SourceContextJSON._readMessage(
        msg.sourceContext,
        _sourceContext_,
      );
    }
    const _mixins_ = json["mixins"];
    if (_mixins_) {
      for (const item of _mixins_) {
        const m = MixinJSON.initialize();
        MixinJSON._readMessage(m, item);
        msg.mixins.push(m);
      }
    }
    const _syntax_ = json["syntax"];
    if (_syntax_) {
      msg.syntax = _syntax_;
    }
    return msg;
  },
};

export const MethodJSON = {
  /**
   * Serializes Method to JSON.
   */
  encode: function (msg: PartialDeep<Method>): string {
    return JSON.stringify(MethodJSON._writeMessage(msg));
  },

  /**
   * Deserializes Method from JSON.
   */
  decode: function (json: string): Method {
    return MethodJSON._readMessage(MethodJSON.initialize(), JSON.parse(json));
  },

  /**
   * Initializes Method with all fields set to their default value.
   */
  initialize: function (): Method {
    return {
      name: "",
      requestTypeUrl: "",
      requestStreaming: false,
      responseTypeUrl: "",
      responseStreaming: false,
      options: [],
      syntax: protoscript.Syntax._fromInt(0),
    };
  },

  /**
   * @private
   */
  _writeMessage: function (msg: PartialDeep<Method>): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.name) {
      json["name"] = msg.name;
    }
    if (msg.requestTypeUrl) {
      json["requestTypeUrl"] = msg.requestTypeUrl;
    }
    if (msg.requestStreaming) {
      json["requestStreaming"] = msg.requestStreaming;
    }
    if (msg.responseTypeUrl) {
      json["responseTypeUrl"] = msg.responseTypeUrl;
    }
    if (msg.responseStreaming) {
      json["responseStreaming"] = msg.responseStreaming;
    }
    if (msg.options?.length) {
      json["options"] = msg.options.map(protoscript.OptionJSON._writeMessage);
    }
    if (msg.syntax && protoscript.SyntaxJSON._toInt(msg.syntax)) {
      json["syntax"] = msg.syntax;
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Method, json: any): Method {
    const _name_ = json["name"];
    if (_name_) {
      msg.name = _name_;
    }
    const _requestTypeUrl_ = json["requestTypeUrl"] ?? json["request_type_url"];
    if (_requestTypeUrl_) {
      msg.requestTypeUrl = _requestTypeUrl_;
    }
    const _requestStreaming_ =
      json["requestStreaming"] ?? json["request_streaming"];
    if (_requestStreaming_) {
      msg.requestStreaming = _requestStreaming_;
    }
    const _responseTypeUrl_ =
      json["responseTypeUrl"] ?? json["response_type_url"];
    if (_responseTypeUrl_) {
      msg.responseTypeUrl = _responseTypeUrl_;
    }
    const _responseStreaming_ =
      json["responseStreaming"] ?? json["response_streaming"];
    if (_responseStreaming_) {
      msg.responseStreaming = _responseStreaming_;
    }
    const _options_ = json["options"];
    if (_options_) {
      for (const item of _options_) {
        const m = protoscript.OptionJSON.initialize();
        protoscript.OptionJSON._readMessage(m, item);
        msg.options.push(m);
      }
    }
    const _syntax_ = json["syntax"];
    if (_syntax_) {
      msg.syntax = _syntax_;
    }
    return msg;
  },
};

export const MixinJSON = {
  /**
   * Serializes Mixin to JSON.
   */
  encode: function (msg: PartialDeep<Mixin>): string {
    return JSON.stringify(MixinJSON._writeMessage(msg));
  },

  /**
   * Deserializes Mixin from JSON.
   */
  decode: function (json: string): Mixin {
    return MixinJSON._readMessage(MixinJSON.initialize(), JSON.parse(json));
  },

  /**
   * Initializes Mixin with all fields set to their default value.
   */
  initialize: function (): Mixin {
    return {
      name: "",
      root: "",
    };
  },

  /**
   * @private
   */
  _writeMessage: function (msg: PartialDeep<Mixin>): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (msg.name) {
      json["name"] = msg.name;
    }
    if (msg.root) {
      json["root"] = msg.root;
    }
    return json;
  },

  /**
   * @private
   */
  _readMessage: function (msg: Mixin, json: any): Mixin {
    const _name_ = json["name"];
    if (_name_) {
      msg.name = _name_;
    }
    const _root_ = json["root"];
    if (_root_) {
      msg.root = _root_;
    }
    return msg;
  },
};
