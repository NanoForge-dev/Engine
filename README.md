<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/push-docs.yml/badge.svg" alt="Documentation status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff" alt="Last commit" /></a>
    	<a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

This repository contains multiple packages with separate [releases][github-releases]. Nanoforge is a powerful game engine for web browser.

## Documentation

The full documentation can be found at: [https://nanoforge-dev.github.io/docs/engine](https://nanoforge-dev.github.io/docs/engine)

## Usage

To use Nanoforge Engine, please refer to the [CLI documentation][cli-source] !

First, install the CLI :

```bash
npm install -g @nanoforge-dev/cli
```

And then create a new project :

```bash
nf new
```

## Packages

- `@nanoforge-dev/common` ([source][common-source]) - Common interfaces and utilities used by Nanoforge Engine
- `@nanoforge-dev/core` ([source][core-source]) - A core package that contains game main loop
- `@nanoforge-dev/ecs-lib` ([source][ecs-lib-source]) - A powerful data structure for managing game entities (_do not use this in your projects_)
- `@nanoforge-dev/ecs-client` ([source][ecs-client-source]) - A wrapper of `@nanoforge-dev/ecs-lib` for client-side usage
- `@nanoforge-dev/ecs-server` ([source][ecs-server-source]) - A wrapper of `@nanoforge-dev/ecs-lib` for server-side usage
- `@nanoforge-dev/config` ([source][config-source]) - A wrapper of `class-validator` and `class-transformer` to imports validation and transformation decorators
- `@nanoforge-dev/graphics-2d` ([source][graphics-2d-source]) - A base 2D graphics library
- `@nanoforge-dev/asset-manager` ([source][asset-manager-source]) - A manager for loading assets to uniform workwith between client and server
- `@nanoforge-dev/network-client` ([source][network-client-source]) - A network lib with tcp and udp support for client-side usage
- `@nanoforge-dev/network-server` ([source][network-server-source]) - A network lib with tcp and udp support for server-side usage
- `@nanoforge-dev/input` ([source][input-source]) - An input manager for handling keyboard and mouse events
- `@nanoforge-dev/music` ([source][music-source]) - A music player for your game
- `@nanoforge-dev/sound` ([source][sound-source]) - A sound manager for your game

## Contributing

Please read through our [contribution guidelines][contributing] before starting a pull request. We welcome contributions of all kinds, not just code! If you're stuck for ideas, look for the [good first issue][good-first-issue] label on issues in the repository. If you have any questions about the project, feel free to ask them on [Discussions][discussions]. Before creating your own issue or pull request, always check to see if one already exists! Don't rush contributions, take your time and ensure you're doing it correctly.

## Help

If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle nudge in the right direction, please ask on [Discussions][discussions].

[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
[discussions]: https://github.com/NanoForge-dev/Engine/discussions
[cli-source]: https://github.com/NanoForge-dev/CLI
[github-releases]: https://github.com/NanoForge-dev/Engine/releases
[asset-manager-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/asset-manager
[common-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/common
[config-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/config
[core-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/core
[ecs-client-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/ecs-client
[ecs-lib-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/ecs-lib
[ecs-server-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/ecs-server
[graphics-2d-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/graphics-2d
[input-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/input
[music-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/music
[network-client-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/network-client
[network-server-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/network-server
[sound-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/sound
[good-first-issue]: https://github.com/NanoForge-dev/Engine/contribute
