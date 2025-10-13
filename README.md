# Engine

This repository contains the full engine for NanoForge.
It can be used by itself.

The engine is made of multiple components:

- [ecs](packages/ecs)
- [input](packages/input)
- [core](packages/core)
- [common](packages/common)
- [graphics-2d](packages/graphics-2d)
- [asset-manager](packages/asset-manager)
- [sound](packages/sound)
- [music](packages/music)

This is the full nanoforge engine including all the default libraries.

In order to manage this project we use (pnpm)[https://pnpm.io/]

## Installing dependencies

To install dependencies run:

```sh
pnpm i
```

## Building

To build the project run:

```sh
pnpm build
```

## Tests

To run tests use:

```sh
pnpm test
```
