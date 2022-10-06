# Changelog

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
