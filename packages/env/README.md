<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/env"><img src="https://img.shields.io/npm/v/@nanoforge-dev/env.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/env"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/env.svg?maxAge=3600" alt="npm downloads" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/env"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fenv" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/env` is a wrapper around [class-validator][class-validator] and [class-transformer][class-transformer] used to validate and transform raw environment values (`InitContext.env`, `process.env`, …) into typed, decorated configuration classes.

## Installation

**Node.js 26 or newer is required.**

```sh
npm install @nanoforge-dev/env
yarn add @nanoforge-dev/env
pnpm add @nanoforge-dev/env
bun add @nanoforge-dev/env
```

## Warning

This library is intended for use by other NanoForge libraries and application code that reads environment configuration — it is not a library that consumers of `@nanoforge-dev/core` need to install standalone unless they are declaring their own environment-backed config classes.

## Example usage

Declare a configuration class decorated with `@nanoforge-dev/env`'s decorators:

```ts
import {
  Default,
  Expose,
  IsBoolean,
  IsByteLength,
  IsIpOrURL,
  IsOptional,
  IsPort,
  TransformToBoolean,
} from "@nanoforge-dev/env";

export class ClientConfigNetwork {
  // Optional port, but must be a valid port string when present.
  @Expose()
  @IsOptional()
  @IsPort()
  SERVER_TCP_PORT?: string;

  // Required — must be a valid IP address or URL.
  @Expose()
  @IsIpOrURL(undefined, undefined, { protocols: ["ws", "wss", "http", "https"] })
  SERVER_ADDRESS!: string;

  // Falls back to "PACKET_END" when absent.
  @Expose()
  @Default("PACKET_END")
  @IsByteLength(2, 64)
  MAGIC_VALUE!: string;

  // "true"/"false" string values are transformed into a native boolean.
  @Expose()
  @TransformToBoolean()
  @IsBoolean()
  @Default(false)
  WSS!: boolean;
}
```

Then validate and populate an instance from a raw environment object with `registerEnv`:

```ts
import { registerEnv } from "@nanoforge-dev/env";

import { ClientConfigNetwork } from "./config.client.network";

export class NetworkClientLibrary extends Library {
  public override async __init(ctx: InitContext): Promise<void> {
    const config = await registerEnv(ClientConfigNetwork, ctx.env);

    // `config` is a fully validated, defaulted ClientConfigNetwork instance.
  }
}
```

`registerEnv` throws `NfEnvValidationException` when the given environment doesn't satisfy the class's decorators.

All of [class-validator][class-validator]'s decorators (`IsString`, `IsPort`, `IsOptional`, …) and `class-transformer`'s `@Expose`/`@Transform` are re-exported directly from this package, alongside `@nanoforge-dev/env`'s own additions:

- `@Default(value)` — supplies a fallback when the property is `undefined`/`null`.
- `@IsIpOrURL(...)` — validates an IPv4/IPv6 address or a fully qualified domain name.
- `@TransformToBoolean()` — transforms the string `"true"`/`"false"` into a native boolean.

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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/env
[npm]: https://www.npmjs.com/package/@nanoforge-dev/env
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
[class-validator]: https://github.com/typestack/class-validator
[class-transformer]: https://github.com/typestack/class-transformer
