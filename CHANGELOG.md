# Changelog

## v0.0.18

- Fix JSON serializtion for Timestamp and Duration well known types. See [#39](https://github.com/tatethurston/ProtoScript/issues/39).
- Accept all value permutations as described by the Proto3 JSON spec when parsing JSON messages.
- #initialize now accepts partial messages. This enables you to create a full message with select fields set to a user-provided value:
  ```ts
  const ron = User.initialize({ firstName: "Ron" });
  ```

## v0.0.18

- Fix JSON deserializtion of recursive (self referencing) messages.
- Fix generated TypeScript types for repeated recursive (self referencing) messages.

## v0.0.17

- Omit `Uint8Array` from `PartialDeep` type. This fixes a type error for TypeScript users that use `bytes`.

## v0.0.16

- `encode` methods now accept partials for nested messages as well (`PartialDeep` instead of `Partial`). Previously, the types required that full messages were provided for any nested messages.
- Buf users will need to update their `buf.gen.yaml` path:
  `buf.gen.yaml`

  ```diff
  version: v1
  plugins:
    - name: protoc-gen-protoscript
  -    path: ./node_modules/protoscript/compiler.js
  +    path: ./node_modules/protoscript/dist/compiler.js
      out: .
      opt:
        - language=typescript
      strategy: all
  ```

## v0.0.15

This release includes a number of bug fixes

- Fix treeshaking for nested messages. Previously, there were cases where protobuf did not tree shake out of JSON only client usage. Thanks @noahseger!
- Fix camelcasing for fieldnames with multiple sequential underscores. Thanks @noahseger!
- Fix generated toInt helper when using aliased enums. Thanks @noahseger!
- Fix recursive message initialization. Previously, recursive messages, messages with fields that referenced themselves, would cause an infinite loop when initializing because protoscript eagerly instantiates message objects. Now the compiler detects cycles and will instead generate up until the cycle, and mark the recursive field as optional.

## v0.0.14

- Fix intermittent EAGAIN issue encountered when compiling protos

- Use glob imports for generated messages instead of destructuring. This preserves tree shaking, but preserves module namespacing to disambiguate name collisions between protos. Previously, identically named messages in different modules could causes a name collision, eg:

  ```proto
  // foo.proto
  message Foo {}
  ```

  ```proto
  // bar.proto
  import "foo.proto";
  message Foo {}
  ```

  Would result in errors in the generated code. Now, this is namespaced and works correctly.

## v0.0.13

Update package [Protocol Buffers Well-Known Types](https://developers.google.com/protocol-buffers/docs/reference/google.protobuf) to enable strict ESM.

## v0.0.12

[Protocol Buffers Well-Known Types](https://developers.google.com/protocol-buffers/docs/reference/google.protobuf) are now exported from `protoscript`. References to well-known types are now imported from `protoscript` rather than being generated. This is a non breaking change. If you have well-known types in your project, you can remove the `google/protobuf` directory that was generated in previous versions alongside your other `.pb.js/ts` files.

The output location of `google/protobuf` was a common reason for using `dest` in `proto.config.mjs` so this change should facilitate zero configuration for a greater number of projects.

## v0.0.11

- Revert `Include file extensions in generated file imports` introduced in `v0.0.7` for TypeScript users. Generated TypeScript imports will revert to the following:

```diff
- import { Foo } from './foo.pb.js';
+ import { Foo } from './foo.pb';
```

When targeting ESM, the TypeScript compiler expects `.js` extensions and not `.ts` extensions for imports because the compiler does not manipulate import paths: https://www.typescriptlang.org/docs/handbook/esm-node.html.

Including a full extension results in the following TypeScript error:

```
[tsserver 2691] [E] An import path cannot end with a '.ts' extension.
```

The TypeScript team's recommendation to use `.js` extensions for `.ts` file imports when targeting ESM causes a number of issues with the broader JavaScript ecosystem. Until this situation is rectified, ProtoScript will not emit ESM compliant extensions for TypeScript. This only impacts TypeScript users who wish to target ESM in Node.JS using the TypeScript compiler, as bundlers are not pedantic about file extensions. If you're impacted by this, please join the discussion in [#202](https://github.com/tatethurston/TwirpScript/issues/202.)

## v0.0.10

- Change configuration file format. Now, the configuration file is JS instead of JSON. This provides better discoverability and type checking for TypeScript users.

The following `.protoscript.json`:

```json
{
  "root": "src",
};
```

Would be renamed to `proto.config.mjs` and changed to the following:

```js
/** @type {import('protoscript').Config} */
export default {
  root: "src",
};
```

- Use relative file path for determining path to compiler instead of hard coding from project root. This should interop better with more exotic package tooling and repo setup.

- Fix: Improved `map` detection. Previously field types suffixed with `Entry` were incorrectly flagged as maps. This has been fixed.

## v0.0.9

- Remove `process.stdin.fd` usage to see if it resolves intermittent `Error: EAGAIN: resource temporarily unavailable, read`. See [#191](https://github.com/tatethurston/TwirpScript/issues/191) for more context.

## v0.0.8

- Use ["property"] access for JSON objects. This ensures generated JSON serialization code is correct when using minification tools that perform property mangling. See #4 for more context.

## v0.0.7

- Include file extensions in generated file imports.

## v0.0.6

- Distribute strict ESM. A CommonJS is runtime is included for legacy node clients. Code generation uses ESM and requires Node.js v14 or later.
