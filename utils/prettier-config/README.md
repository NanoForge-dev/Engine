<div align="center">
	<br />
	<p>
		<a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
	</p>
	<br />
	<p>
		<a href="https://www.npmjs.com/package/@nanoforge-dev/utils-prettier-config"><img src="https://img.shields.io/npm/v/@nanoforge-dev/utils-prettier-config.svg?maxAge=3600" alt="npm version" /></a>
		<a href="https://www.npmjs.com/package/@nanoforge-dev/utils-prettier-config"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/utils-prettier-config.svg?maxAge=3600" alt="npm downloads" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/actions"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/commits/main/utils/prettier-config"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=utils%2Fprettier-config" alt="Last commit." /></a>
	</p>
</div>

## About

`@nanoforge-dev/utils-prettier-config` is an Prettier configuration for Nanoforge projects.

## Installation

**Node.js 24.11.0 or newer is required.**

```sh
npm install --save-dev @nanoforge-dev/utils-prettier-config
yarn add -D @nanoforge-dev/utils-prettier-config
pnpm add -D @nanoforge-dev/utils-prettier-config
bun add -d @nanoforge-dev/utils-prettier-config
```

## Example usage

Use the configuration in your `prettier.config.js` file:

```ts
import nanoforgeConfig from "@nanoforge-dev/utils-prettier-config";

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/utils/prettier-config
[npm]: https://www.npmjs.com/package/@nanoforge-dev/utils-prettier-config
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
