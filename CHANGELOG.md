# Changelog

## v0.0.9

- Remove `process.stdin.fd` usage to see if it resolves intermittent `Error: EAGAIN: resource temporarily unavailable, read`. See [#191](https://github.com/tatethurston/TwirpScript/issues/191) for more context.

## v0.0.8

- Use ["property"] access for JSON objects. This ensures generated JSON serialization code is correct when using minification tools that perform property mangling. See #4 for more context.

## v0.0.7

- Include file extensions in generated file imports.

## v0.0.6

- Distribute strict ESM. A CommonJS is runtime is included for legacy node clients. Code generation uses ESM and requires Node.js v14 or later.
