<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/config"><img src="https://img.shields.io/npm/v/@nanoforge-dev/config.svg?maxAge=3600" alt="npm version" /></a>
        <a href="https://www.npmjs.com/package/@nanoforge-dev/config"><img src="https://img.shields.io/npm/dt/@nanoforge-dev/config.svg?maxAge=3600" alt="npm downloads" /></a>
		<a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml/badge.svg" alt="Documentation status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main/packages/config"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff&path=packages%2Fconfig" alt="Last commit" /></a>
    	<a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

`@nanoforge-dev/config` is a wrapper of [class-validator][class-validator] and [class-transformer][class-transformer] to imports validation and transformation decorators.

## Installation

**Node.js 25 or newer is required.**

```sh
npm install @nanoforge-dev/config
yarn add @nanoforge-dev/config
pnpm add @nanoforge-dev/config
bun add @nanoforge-dev/config
```

## Warning

This library is of exclusive usage for other libraries. To put variables in the environment to allow libraries to use it through this config library, you must put it in `.env` file at the root of your project (or in your environment) :

```dotenv
NANOFORGE_CLIENT_SERVER_TCP_PORT=4445
NANOFORGE_CLIENT_SERVER_UDP_PORT=4444
NANOFORGE_CLIENT_SERVER_ADDRESS=127.0.0.1
```

You must prefix your variables according to this table :

| Prefix              | Availability             |
| :------------------ | :----------------------- |
| `NANOFORGE_CLIENT_` | Available in client only |
| `NANOFORGE_SERVER_` | Available in server only |
| `NANOFORGE_`        | Available in both apps   |

⚠️ Prefixs are removed in libs

You can also put it in init options (every value must be string or undefined) :

```ts
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { NetworkLibrary } from "@nanoforge-dev/network";

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createClient();

  const network = new NetworkLibrary();

  app.useNetwork(network);

  await app.init({
    ...options,
    env: {
      ...options.env,
      SERVER_TCP_PORT: "4445",
      SERVER_UDP_PORT: "4444",
      SERVER_ADDRESS: "127.0.0.1",
    },
  });

  await app.run();
}
```

## Example usage

Initialize the library in your main file.

```ts
export class NetworkClientLibrary extends BaseNetworkLibrary {
  get __name(): string {
    return "NetworkClientLibrary";
  }

  public override async __init(context: InitContext): Promise<void> {
    const config = await context.config.registerConfig(ClientConfigNetwork);

    // Do something with config
  }
}
```

Using this config

```ts
import {
  Default,
  Expose,
  IsByteLength,
  IsIpOrFQDN,
  IsOptional,
  IsPort,
} from "@nanoforge-dev/config";

export class ClientConfigNetwork {
  // This var must be a string port (ex: "4444") but can be undefined
  @Expose()
  @IsOptional()
  @IsPort()
  SERVER_TCP_PORT?: string;

  @Expose()
  @IsOptional()
  @IsPort()
  SERVER_UDP_PORT?: string;

  // This var must be ip address or fqdn (it cannot be undefined)
  @Expose()
  @IsIpOrFQDN()
  SERVER_ADDRESS?: string;

  // This var must be a byte length between 2 and 64. It can be undefined as it as a default value.
  @Expose()
  @Default("PACKET_END")
  @IsByteLength(2, 64)
  MAGIC_VALUE!: string;
}
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
[source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/config
[npm]: https://www.npmjs.com/package/@nanoforge-dev/config
[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
[class-validator]: https://github.com/typestack/class-validator
[class-transformer]: https://github.com/typestack/class-transformer
