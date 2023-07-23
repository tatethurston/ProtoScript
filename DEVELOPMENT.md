# Local Development

### First time setup

1. Install the following dependencies:

```sh
brew install protobuf
brew install bazel
```

2. From the project directory root:

```sh
nvm use
pnpm install
pnpm package:build
# second time to link protoscript bin commands now available after package:build in packages
pnpm install
pnpm examples:regen
pnpm build:wellknowntypes
pnpm test
```

The source code for the package is in `src/`.

There are examples that use the locally built package in `examples/`.

There are e2e tests in `packages/e2e/`.

### Testing

Tests are run with jest.

From the project directory root:

`pnpm test`

### Linting

As part of installation, husky pre-commit hooks are installed to run linters against the repo.

### Publishing

There are CI and publishing GitHub workflows in `./github/workflows`. These are named `ci.yml` and `publish.yml`.

### Note

`protoscript` package self referencing is used by the wellknowntypes. right now works in a surprising manner: the package is built into dist, but the source package.json has the same name as the package.json that will be generated into dist. This results in self referencing using the source directory when everything is built.
