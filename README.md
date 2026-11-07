<div align="center">
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev"><img src="https://github.com/NanoForge-dev/Engine/blob/main/.github/logo.png" width="546" alt="NanoForge" /></a>
    </p>
    <br />
    <p>
        <a href="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml"><img src="https://github.com/NanoForge-dev/Engine/actions/workflows/tests.yml/badge.svg" alt="Tests status" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/commits/main"><img src="https://img.shields.io/github/last-commit/NanoForge-dev/Engine.svg?logo=github&logoColor=ffffff" alt="Last commit" /></a>
        <a href="https://github.com/NanoForge-dev/Engine/graphs/contributors"><img src="https://img.shields.io/github/contributors/NanoForge-dev/Engine.svg?maxAge=3600&logo=github&logoColor=fff&color=00c7be" alt="Contributors" /></a>
    </p>
</div>

## About

This repository contains multiple packages with separate [releases][github-releases]. Nanoforge is a powerful game engine for web browser.

## Documentation

The full documentation can be found at: [https://docs.nanoforge.eu/docs/engine/getting-started/index](https://docs.nanoforge.eu/docs/engine/getting-started/index)

## Usage

To use Nanoforge Engine, please refer to the [CLI documentation][cli-docs] !

First, install the CLI :

```bash
npm install -g @nanoforge-dev/cli
```

And then create a new project :

```bash
nf new
```

## Packages

- `@nanoforge-dev/asset` ([source][asset-source]) - The built-in asset library, to read the files shipped with a game
- `@nanoforge-dev/common` ([source][common-source]) - Common interfaces and utilities used by Nanoforge Engine
- `@nanoforge-dev/core` ([source][core-source]) - A core package that creates the application and runs the game loop
- `@nanoforge-dev/env` ([source][env-source]) - A wrapper of `class-validator` and `class-transformer` to validate environment variables
- `@nanoforge-dev/ecs` ([source][ecs-source]) - A powerful data structure for managing game entities, for the client and the server
- `@nanoforge-dev/editor-lib` ([source][editor-source]) - The bridge between a running game and the NanoForge editor
- `@nanoforge-dev/graphics-2d` ([source][graphics-2d-source]) - A base 2D graphics library
- `@nanoforge-dev/graphics-3d` ([source][graphics-3d-source]) - A 3D graphics library built on Three.js
- `@nanoforge-dev/input` ([source][input-source]) - An input manager for handling keyboard, mouse and controller events
- `@nanoforge-dev/music` ([source][music-source]) - A music player for your game
- `@nanoforge-dev/network` ([source][network-source]) - A network lib with tcp and udp support, for the client and the server
- `@nanoforge-dev/scene` ([source][scene-source]) - A scene manager, with vars shared by scenes and systems
- `@nanoforge-dev/sound` ([source][sound-source]) - A sound manager for your game

## Contributing

Please read through our [contribution guidelines][contributing] before starting a pull request. We welcome contributions of all kinds, not just code! If you're stuck for ideas, look for the [good first issue][good-first-issue] label on issues in the repository. If you have any questions about the project, feel free to ask them on [Discussions][discussions]. Before creating your own issue or pull request, always check to see if one already exists! Don't rush contributions, take your time and ensure you're doing it correctly.

## Help

If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle nudge in the right direction, please ask on [Discussions][discussions].

[contributing]: https://github.com/NanoForge-dev/Engine/blob/main/.github/CONTRIBUTING.md
[discussions]: https://github.com/NanoForge-dev/Engine/discussions
[cli-docs]: https://docs.nanoforge.eu/docs/cli/getting-started/quickstart
[github-releases]: https://github.com/NanoForge-dev/Engine/releases
[asset-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/asset
[common-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/common
[core-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/core
[env-source]: https://github.com/NanoForge-dev/Engine/tree/main/packages/env
[ecs-source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/ecs
[editor-source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/editor
[graphics-2d-source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/graphics-2d
[graphics-3d-source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/graphics-3d
[input-source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/input
[music-source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/music
[network-source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/network
[scene-source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/scene
[sound-source]: https://github.com/NanoForge-dev/Engine/tree/main/modules/sound
[good-first-issue]: https://github.com/NanoForge-dev/Engine/contribute
