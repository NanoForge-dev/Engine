# Changelog

All notable changes to this project will be documented in this file.

# [@nanoforge-dev/core@1.0.0](https://github.com/NanoForge-dev/Engine/tree/@nanoforge-dev/core@1.0.0) - (2026-01-09)

## Bug Fixes

- **graphics:** Game loop ([53329d2](https://github.com/NanoForge-dev/Engine/commit/53329d28c47bfac9fe86259e9fc6f42b206062a8)) by @Exeloo
- **graphics:** Fix display ([d8522e5](https://github.com/NanoForge-dev/Engine/commit/d8522e56678f3bd136733f7941c1d917c18b1400)) by @Exeloo
- **ecs:** Fix tests ([d33ada5](https://github.com/NanoForge-dev/Engine/commit/d33ada5d9c37e331b8178aa1fc0daee88b07131c)) by @Exeloo
- **ecs:** Change type handling on lib ecs ([580192d](https://github.com/NanoForge-dev/Engine/commit/580192d5038f386c965434f78aacdf3d1e399ff8)) by @Exeloo

## Documentation

- Update README files with new structure and detailed usage examples for all packages (#157) ([63fab73](https://github.com/NanoForge-dev/Engine/commit/63fab7326bd9c7e6b00f950694ab16c9d9190c53)) by @Exeloo
- Add funding (#147) ([7301fad](https://github.com/NanoForge-dev/Engine/commit/7301fad10f59b7e1f7fa788f8a2f6fc81d0db72e)) by @Exeloo
- Add a basic introduction readme ([b240964](https://github.com/NanoForge-dev/Engine/commit/b240964a265b31769a8c5422e23e20156ba56192)) by @MartinFillon
- Add building and dependency docs to every readme ([2d4785b](https://github.com/NanoForge-dev/Engine/commit/2d4785bdcb455e83337b37540f9ab6b3394c0850)) by @MartinFillon

## Features

- **packages/network:** Client and server for tcp/udp and networked pong as example (#156) ([839fb95](https://github.com/NanoForge-dev/Engine/commit/839fb95449f6ae0ee66d7f7e279374268b743f65)) by @Tchips46
- **core:** Add client/server distinction and update rendering logic (#119) ([5271432](https://github.com/NanoForge-dev/Engine/commit/5271432710031396d7e433bfdfb015e3871f69d0)) by @Exeloo
- Add schematics used types (#102) ([b992306](https://github.com/NanoForge-dev/Engine/commit/b9923064ba1da3164b1739fcdec5a819734c4ba2)) by @Exeloo
- **core:** Introduce `EditableApplicationContext` for managing sound libraries ([6c7bac2](https://github.com/NanoForge-dev/Engine/commit/6c7bac261eeb7ad79203d5695d5ad76dc9e9e9f5)) by @Exeloo
- **core:** Add Context that admit a ClientLibraryManager ([3835bc8](https://github.com/NanoForge-dev/Engine/commit/3835bc8a6e6d039f11a513b7fe54c353f90e9fe1)) by @Exeloo
- **music:** Finish music library and add an interface for mutable libraries ([8e00c5d](https://github.com/NanoForge-dev/Engine/commit/8e00c5d00f2901ada86f59667eff7e5d3446076b)) by @MartinFillon
- **core:** Add `class-transformer` and `class-validator` dependencies for validation utilities ([fd94fe7](https://github.com/NanoForge-dev/Engine/commit/fd94fe7755999c5529335666720899792a691a36)) by @Exeloo
- **common, core, config:** Introduce configuration registry and validation system ([4fafb82](https://github.com/NanoForge-dev/Engine/commit/4fafb82576fec6866fc281ad5b10321d2ac430df)) by @Exeloo
- **core:** Enhance type safety and execution context handling ([d986030](https://github.com/NanoForge-dev/Engine/commit/d986030a333bc08d2e37291d1a023cf8d7a6e1d6)) by @Exeloo
- **app:** Add the ability to mute and unmute sounds ([947bdc0](https://github.com/NanoForge-dev/Engine/commit/947bdc00784a4c3313fe08feb4f91fc91b3ac7b7)) by @MartinFillon
- **sound:** Add basic sound playing to example ([7335814](https://github.com/NanoForge-dev/Engine/commit/7335814fc532ee92a5f9d776f409c5faa4d56423)) by @MartinFillon
- **core:** Add default libraries to constructor ([7d9da69](https://github.com/NanoForge-dev/Engine/commit/7d9da69be4301875020176656276236b88b737f1)) by @Exeloo
- Add dependencies handling ([e51dd3b](https://github.com/NanoForge-dev/Engine/commit/e51dd3bdb5e2e3de21339bf6218e85f935efb9d5)) by @Exeloo
- **common:** Add dependencies handler ([edb098a](https://github.com/NanoForge-dev/Engine/commit/edb098a65fb932ba9a9532a9b1eee7d64a7a8f0d)) by @Exeloo
- **core:** Add tickrate and fix runner ([1dba5bd](https://github.com/NanoForge-dev/Engine/commit/1dba5bd89ffa20dfd29b079f93c3eb923ffbdbbc)) by @Exeloo
- **input:** Add input library ([387e97d](https://github.com/NanoForge-dev/Engine/commit/387e97d7c3015a869947af4acecf48e8e1b0e2b8)) by @Exeloo
- **game:** Create pong example game ([4b66674](https://github.com/NanoForge-dev/Engine/commit/4b66674c750f345e860d225384054423433beb07)) by @bill-h4rper
- **game:** Add width and height ([c93c985](https://github.com/NanoForge-dev/Engine/commit/c93c985665bd99c09bc410f1499d11aeaffe3c4c)) by @Exeloo
- **game:** Add graphics factory ([0f4453c](https://github.com/NanoForge-dev/Engine/commit/0f4453ced908b39e953a672324e97eba82bfeaa3)) by @Exeloo
- **asset-manager:** Add asset manager ([1774a26](https://github.com/NanoForge-dev/Engine/commit/1774a26593099b4faa0a2527d1684de35211d5d2)) by @Exeloo
- Add asset manager default in core ([26cc5a9](https://github.com/NanoForge-dev/Engine/commit/26cc5a99e014fbc8669a43cc4aa4d78ecc1dee14)) by @Exeloo
- Add core and common ([1755c79](https://github.com/NanoForge-dev/Engine/commit/1755c799c143513d72b28edaac875267d484a44f)) by @Exeloo
- Initial commit ([c9bb59e](https://github.com/NanoForge-dev/Engine/commit/c9bb59ee963e7b444e8668db55597915e9ef0e4b)) by @Exeloo

## Refactor

- **core:** Remove default libs in factory (#118) ([fa893c7](https://github.com/NanoForge-dev/Engine/commit/fa893c71616f151343c2f52a4723a64cca65814a)) by @Exeloo
- Migrate namespaces to `@nanoforge-dev` and update related imports ([c84c927](https://github.com/NanoForge-dev/Engine/commit/c84c927ead941d914e5a9fd752fd3a5ac969f981)) by @Exeloo
- **libraries:** Implement initialization validation and standardize nullable fields ([8b04575](https://github.com/NanoForge-dev/Engine/commit/8b04575cf7f649a440b8f40ad6114414406b0c1a)) by @Exeloo

