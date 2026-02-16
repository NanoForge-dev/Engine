# Changelog

All notable changes to this project will be documented in this file.

# [@nanoforge-dev/graphics-2d@1.0.1](https://github.com/NanoForge-dev/Engine/compare/@nanoforge-dev/graphics-2d@1.0.0...@nanoforge-dev/graphics-2d@1.0.1) - (2026-02-16)

## Documentation

- Setup typedoc (#192) ([fa908e7](https://github.com/NanoForge-dev/Engine/commit/fa908e7e268fa1770be58fc62a0257f3760480b2)) by @MartinFillon
- Fix readme badges (#186) ([fd8d93d](https://github.com/NanoForge-dev/Engine/commit/fd8d93d13a0fbad95ef9952acd10faad9e112c78)) by @Exeloo

# [@nanoforge-dev/graphics-2d@1.0.0](https://github.com/NanoForge-dev/Engine/tree/@nanoforge-dev/graphics-2d@1.0.0) - (2026-01-09)

## Bug Fixes

- Issues caused by the new build method (#122) ([b5b4fc3](https://github.com/NanoForge-dev/Engine/commit/b5b4fc3fa546067017db8f56603b76df0345bbcf)) by @Exeloo
- **graphics-2d, ecs:** Update type handling in vertex buffer and library init test ([6e44a2c](https://github.com/NanoForge-dev/Engine/commit/6e44a2cae0ab3a3cff5908389765a512ca9bd2d7)) by @Exeloo
- **graphics:** Game loop ([53329d2](https://github.com/NanoForge-dev/Engine/commit/53329d28c47bfac9fe86259e9fc6f42b206062a8)) by @Exeloo
- **graphics:** Fix tests ([0adefdf](https://github.com/NanoForge-dev/Engine/commit/0adefdfde6b9d7e3d6fa08384be9e46c7722ff5b)) by @Exeloo
- **graphics:** Fix display ([d8522e5](https://github.com/NanoForge-dev/Engine/commit/d8522e56678f3bd136733f7941c1d917c18b1400)) by @Exeloo
- **common:** Change is running ([ed54f84](https://github.com/NanoForge-dev/Engine/commit/ed54f847073f37188b7a11f3e39035e4c8c30918)) by @Exeloo
- **ecs:** Change type handling on lib ecs ([580192d](https://github.com/NanoForge-dev/Engine/commit/580192d5038f386c965434f78aacdf3d1e399ff8)) by @Exeloo

## Documentation

- Update README files with new structure and detailed usage examples for all packages (#157) ([63fab73](https://github.com/NanoForge-dev/Engine/commit/63fab7326bd9c7e6b00f950694ab16c9d9190c53)) by @Exeloo
- Add funding (#147) ([7301fad](https://github.com/NanoForge-dev/Engine/commit/7301fad10f59b7e1f7fa788f8a2f6fc81d0db72e)) by @Exeloo
- Add a basic introduction readme ([b240964](https://github.com/NanoForge-dev/Engine/commit/b240964a265b31769a8c5422e23e20156ba56192)) by @MartinFillon
- Add building and dependency docs to every readme ([2d4785b](https://github.com/NanoForge-dev/Engine/commit/2d4785bdcb455e83337b37540f9ab6b3394c0850)) by @MartinFillon

## Features

- **core:** Introduce `EditableApplicationContext` for managing sound libraries ([6c7bac2](https://github.com/NanoForge-dev/Engine/commit/6c7bac261eeb7ad79203d5695d5ad76dc9e9e9f5)) by @Exeloo
- **example:** Update `pong` game mechanics and graphics integration ([835fb7d](https://github.com/NanoForge-dev/Engine/commit/835fb7dae51660f6c8918cce0486d3624e4b4512)) by @Exeloo
- Add dependencies handling ([e51dd3b](https://github.com/NanoForge-dev/Engine/commit/e51dd3bdb5e2e3de21339bf6218e85f935efb9d5)) by @Exeloo
- Add dependencies to current libs ([9a838dc](https://github.com/NanoForge-dev/Engine/commit/9a838dcfdacd690b889ead64df730d7d35802f91)) by @Exeloo
- **graphics:** Add dynamic size handle of canvas ([047bf0f](https://github.com/NanoForge-dev/Engine/commit/047bf0f61386dba06948cc70b419bcc9e5f4c900)) by @Exeloo
- **graphics:** Add rectangle ([396831d](https://github.com/NanoForge-dev/Engine/commit/396831d511ad59fb2fc4b0266a5092891c9a5d37)) by @Exeloo
- **template:** Add scripts to template ([6ec5066](https://github.com/NanoForge-dev/Engine/commit/6ec5066604cb0ee48fb4e31fe4eca3f425f47d3c)) by @Exeloo
- **game:** Add width and height ([c93c985](https://github.com/NanoForge-dev/Engine/commit/c93c985665bd99c09bc410f1499d11aeaffe3c4c)) by @Exeloo
- **game:** Add graphics factory ([0f4453c](https://github.com/NanoForge-dev/Engine/commit/0f4453ced908b39e953a672324e97eba82bfeaa3)) by @Exeloo
- **graphics:** Add base component and circle component ([28f5c45](https://github.com/NanoForge-dev/Engine/commit/28f5c45229bd525deaca3aacb341e2633be46ea4)) by @Exeloo
- **graphics-2d:** Add base library ([e39a798](https://github.com/NanoForge-dev/Engine/commit/e39a79815eed5faacc38150cf5486e8708d9a486)) by @Exeloo

## Refactor

- Change test engine (#126) ([ce2c71f](https://github.com/NanoForge-dev/Engine/commit/ce2c71fc1d1b5e3fb3ff4e86fd30aa77c969fbe0)) by @Exeloo
- Migrate namespaces to `@nanoforge-dev` and update related imports ([c84c927](https://github.com/NanoForge-dev/Engine/commit/c84c927ead941d914e5a9fd752fd3a5ac969f981)) by @Exeloo
- **libraries:** Implement initialization validation and standardize nullable fields ([8b04575](https://github.com/NanoForge-dev/Engine/commit/8b04575cf7f649a440b8f40ad6114414406b0c1a)) by @Exeloo
- **libs:** Remove `ECSContext` type in favor of `Context` ([b4ea6f1](https://github.com/NanoForge-dev/Engine/commit/b4ea6f1622b4a29cf57b9bfa1b715f56d248806e)) by @Exeloo
- **graphics-2d:** Remove custom rendering core and replace with `Konva` ([278c745](https://github.com/NanoForge-dev/Engine/commit/278c745d8306bc922b1069dce46a29dab2ceff33)) by @Exeloo

## Testing

- Refactor context initialization and asset handling in library tests ([3864643](https://github.com/NanoForge-dev/Engine/commit/38646439ed40dac4d190829e3839228d0e2605fa)) by @Exeloo
- **libs:** Include ConfigRegistry in library initialization test ([b559759](https://github.com/NanoForge-dev/Engine/commit/b5597595087b42132f491cc59ace69d63394c178)) by @Exeloo

