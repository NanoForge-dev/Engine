<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/utils-eslint-config"><img src="https://img.shields.io/npm/v/@nanoforge-dev/utils-eslint-config.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/utils-eslint-config"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/utils-eslint-config.svg?maxAge=3600" alt="npm downloads" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml/badge.svg" alt="Documentation status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/utils/eslint-config"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=utils%2Feslint-config" alt="Last commit" /></a>
    	<a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/utils-eslint-config` is an ESLint configuration for Nanoforge projects.

## Installation

**Node.js 24.11.0 or newer is required.**

```sh
npm install --save-dev @nanoforge-dev/utils-eslint-config
yarn add -D @nanoforge-dev/utils-eslint-config
pnpm add -D @nanoforge-dev/utils-eslint-config
bun add -d @nanoforge-dev/utils-eslint-config
```

## Example usage

Use the configuration in your `eslint.config.js` file:

```ts
import nanoforgeConfig from "@nanoforge-dev/utils-eslint-config";

export default {
  ...nanoforgeConfig,
  // Additional rules
};
```

## Links

- [GitHub][source]
- [npm][npm]

## Contributing

Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the
[documentation][documentation].  
See [the contribution guide][contributing] if you'd like to submit a PR.

## Help

If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle nudge in the right direction, please don't hesitate to ask questions in [discussions][discussions].

[documentation]: https://github.com/NanoForge-dev/Engine
[discussions]: https://github.com/NanoForge-dev/Engine/discussions
[source]: https://github.com/NanoForge-dev/Engine/tree/main/utils/eslint-config
[npm]: https://www.npmjs.com/package/@nanoforge-dev/utils-eslint-config
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
