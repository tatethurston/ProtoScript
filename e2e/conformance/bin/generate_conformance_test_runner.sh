#!/usr/bin/env bash
###
# Run from e2e/conformance:
# ./bin/generate_conformance_test_runner
#
TMP="tmp"
GOOGLE_PROTOBUF_VERSION=23.3

mkdir -p "$TMP"

curl -L https://github.com/protocolbuffers/protobuf/releases/download/v"$GOOGLE_PROTOBUF_VERSION"/protobuf-"$GOOGLE_PROTOBUF_VERSION".tar.gz >|"$TMP"/protobuf-"$GOOGLE_PROTOBUF_VERSION".tar.gz
tar -xzf "$TMP"/protobuf-"$GOOGLE_PROTOBUF_VERSION".tar.gz -C "$TMP"/

pushd "$TMP"/protobuf-"$GOOGLE_PROTOBUF_VERSION"
bazel build test_messages_proto3_cc_proto conformance:conformance_proto conformance:conformance_test conformance:conformance_test_runner
cp bazel-bin/conformance/conformance_test_runner ../../bin/conformance_test_runner
popd

rm -r "$TMP"
