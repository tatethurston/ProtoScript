// https://github.com/google/closure-library/blob/master/closure/goog/asserts/asserts.js#L174
export const assert = (condition: boolean) => {
  if (!condition) {
    throw new Error("Assertion failed");
  }
  return condition;
};

// https://github.com/google/closure-library/blob/master/closure/goog/asserts/asserts.js#L235
export const fail = (message: string) => {
  throw new Error(message);
};
