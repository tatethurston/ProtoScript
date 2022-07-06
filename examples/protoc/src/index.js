const { Hat } = require("./haberdasher_pb");

console.info("Protobuf");
const msg = new Hat([3, "red", "top hat"]).serializeBinary();
console.log("serialized:", msg);
const hat = Hat.deserializeBinary(msg);
console.log("deserialized:", hat.toObject());

console.info("JSON");
console.log("not implemented by protoc");
