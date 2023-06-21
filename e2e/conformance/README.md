Tests for `test_messages_proto2.proto` are intentionally skipped because ProtoScript targets Protocol Buffers v3.

ProtoScript does not implement support for `group`s, and will throw when encountering `group` in protocol buffer messages. Groups are deprecated by protocol buffers and [should not be used](https://protobuf.dev/programming-guides/proto2/#groups).

The conformance test runner is built with `pnpm conformance:build`. `test.ts` is a jest file that executes the conformance test using the `runner.ts` runner.

### Dependencies

`brew install bazel`
