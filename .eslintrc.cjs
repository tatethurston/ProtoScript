// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  ignorePatterns: ["dist", "*.pb.ts", "*.pb.js"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    browser: true,
    node: true,
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "prettier"],
  overrides: [
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        // eslint-disable-next-line no-undef
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      rules: {
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "@typescript-eslint/no-unnecessary-condition": "error",
        "@typescript-eslint/prefer-optional-chain": "error",
      },
    },
  ],
};
