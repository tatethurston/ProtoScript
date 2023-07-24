// https://github.com/google/closure-library/blob/master/closure/goog/asserts/asserts.js#L174
// istanbul ignore next: trivial
export const assert = (condition: boolean) => {
  if (!condition) {
    throw new Error("Assertion failed");
  }
  return condition;
};

// https://github.com/google/closure-library/blob/master/closure/goog/asserts/asserts.js#L235
// istanbul ignore next: trivial
export const fail = (message: string) => {
  throw new Error(message);
};
