import { User, UserJSON } from "./user.pb.js";

// protocol buffers
const bytes = User.encode({
  firstName: "Homer",
  lastName: "Simpson",
  active: true,
  locations: ["Springfield"],
  projects: { SPP: "Springfield Power Plant" },
  manager: {
    firstName: "Montgomery",
    lastName: "Burns",
  },
});
console.log(bytes);

const userFromBytes = User.decode(bytes);
console.log(userFromBytes);

// json
const json = UserJSON.encode({
  firstName: "Homer",
  lastName: "Simpson",
  active: true,
  locations: ["Springfield"],
  projects: { SPP: "Springfield Power Plant" },
  manager: {
    firstName: "Montgomery",
    lastName: "Burns",
  },
});
console.log(json);

const userFromJSON = UserJSON.decode(json);
console.log(userFromJSON);

// ProtoScript generates and consumes plain JavaScript objects (POJOs) over classes. If you want to generate a full message
// with default fields, you can use the #initialize method on the generated message class:
const user = User.initialize();
console.log(user);
