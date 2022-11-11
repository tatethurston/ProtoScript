import { Hat, HatJSON } from "./haberdasher.pb.js";

console.info("Protobuf");
const msg = Hat.encode({ size: { inches: 3 }, color: "red", name: "top hat" });
console.log("serialized:", msg);
const hat = Hat.decode(msg);
console.log("deserialized:", hat);

console.info("JSON");
const json = HatJSON.encode({
  size: { inches: 3 },
  color: "red",
  name: "top hat",
});
console.log("serialized:", json);
const hatJSON = HatJSON.decode(json);
console.log("deserialized:", hatJSON);
