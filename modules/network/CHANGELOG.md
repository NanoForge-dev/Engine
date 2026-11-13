# Changelog

All notable changes to this project will be documented in this file.

# [3.0.0](https://github.com/NanoForge-dev/Engine/compare/2.0.0...3.0.0) - (2026-11-13)

## Breaking Changes

- **network:** Split packets into four delivery channels (#442) ([5abc79e](https://github.com/NanoForge-dev/Engine/commit/5abc79ed66898c1439880bffd854e8b8f70d7a9a)) by @Tchips46
  - **BREAKING CHANGE:** ctx.network.tcp/udp are replaced by sendData / sendToAll / sendToClient / getReceivedPackets / getConnectedClients / isConnected with a channel option; the client only connects when connect() is called; the MAGIC_VALUE env var is removed; the wire format changed (TCP channel tag byte, two labelled data channels, sequence header, no terminator), so clients and servers must be upgraded together.

## Bug Fixes

- **network:** Move connect in init, openning all for chans (#449) ([e744c8e](https://github.com/NanoForge-dev/Engine/commit/e744c8e14d74b983f3a95fa5c59a9e751361dd8e)) by @Tchips46

## Documentation

- Use raw.githubusercontent URL for package README logos (#473) ([be72076](https://github.com/NanoForge-dev/Engine/commit/be72076931c43ab868ca9dd217f192a92f624a8b)) by @cdytotoro-ctrl

## Features

- **network:** P2p mode (#452) ([9f99718](https://github.com/NanoForge-dev/Engine/commit/9f9971874e0af3d0143039292cd02cbe75a45362)) by @Tchips46
- **network:** Packet manager (#448) ([6444163](https://github.com/NanoForge-dev/Engine/commit/6444163c7ae8d88052d3b5349048bbea697e6eb7)) by @Tchips46
- Implement editor bridge and protocol integration (#445) ([0ca8811](https://github.com/NanoForge-dev/Engine/commit/0ca8811254926e9533c3d5dc9e513189cc2c3d5a)) by @Exeloo
- **network:** Send any type of data (#444) ([727e0fa](https://github.com/NanoForge-dev/Engine/commit/727e0faf195d7dc63d120786008e007dff3e2a4e)) by @Tchips46

### New Contributors

- @cdytotoro-ctrl made their first contribution in #473

# [2.0.0](https://github.com/NanoForge-dev/Engine/compare/1.4.2...2.0.0) - (2026-09-27)

## Features

- **network:** Better network identification and better connection handling (#439) ([d7a5669](https://github.com/NanoForge-dev/Engine/commit/d7a566900a543cbf447645ef07e761166568d90d)) by @Tchips46
- Add nanoforge package (#431) ([6801e56](https://github.com/NanoForge-dev/Engine/commit/6801e5634a7d24bf93c92814631bb426d6d64755)) by @Exeloo
- Add new network (#419) ([f1f5c85](https://github.com/NanoForge-dev/Engine/commit/f1f5c8556bfd57cb92ae95bf913d8846a5df42d5)) by @Exeloo

## Refactor

- **network:** Change node webrtc to bun node-datachannel (#436) ([b3752a0](https://github.com/NanoForge-dev/Engine/commit/b3752a084a28d5cba08101b990a8f808d09fb7e5)) by @Tchips46

# Changelog

All notable changes to this project will be documented in this file.
