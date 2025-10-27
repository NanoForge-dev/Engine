## [unreleased]

### Bug Fixes

- *(ecs)* Change jest workflow
- *(ecs)* Constructor are now binded
- *(ecs/sparse array)* No discard on const methods
- *(ecs/sparseArray)* Fix missing erase definition
- *(ecs)* Fix jest workflow and tests compile
- *(ecs)* Add type name verification for vars
- *(ecs)* Change type handling on lib ecs
- *(ecs)* Fix tests
- *(common)* Init lib order
- *(common)* Change is running
- *(graphics)* Fix display
- *(graphics)* Fix tests
- *(graphics)* Game loop
- *(game)* Delete bun.lock
- *(pong)* Delete custom framerate
- *(ecs)* Rename createEntity to spawnEnity
- *(exceptions)* Bad naming
- Change exception handling
- *(common)* Update exception imports and adjust formatting in abstract class
- *(graphics-2d, ecs)* Update type handling in vertex buffer and library init test
- *(music)* Versions issue

### Features

- Initial commit
- *(ecs/compilation)* Add basic makefile
- Add wasm compilation to package.json
- *(ecs/compilation)* Add wasm object creation
- *(ecs/wasm)* Emsdk installation script in Readme.md
- *(ecs/wasm)* Add basic test templated class
- *(ecs/wasm)* Emsdk installation script in Readme.md
- *(ecs)* Setup basic sparse array boiler plate code.
- *(ecs)* Add type generation in makefile
- *(ecs/sparseArray)* Add more functions to the sparse array
- *(ecs/sparseArray)* Add more functions to the sparse array
- Custom header
- Add core and common
- Add asset manager default in core
- *(ecs/registry)* Base regitry and simple tests:
- *(ecs/registry)* Systems handling and testing
- *(asset-manager)* Add base library
- *(asset-manager)* Add asset manager
- *(asset-manager)* Add tests
- *(ecs)* Modify ts rule to get types
- *(graphics-2d)* Add base library
- *(asset-manager)* Add wgsl handling
- *(asset-manager)* Add file return
- *(common)* Add templates to each get library functions
- *(graphics)* Add base component and circle component
- *(ecs/zipper)* Add indexed zipper and zipper with tests
- *(ecs)* Setup wasm to be loaded from path specified in ecs library
- *(ecs)* Add more methods to be exported by ecs library
- *(ecs/tsbindings)* Add the zipper functions to the library
- *(game)* Add template
- *(game)* Add graphics factory
- *(game)* Add width and height
- *(game)* Create pong example game
- *(template)* Add scripts to template
- *(example/pong)* Base velocity system clocked with a framerate limiter
- *(ecs)* Add type for components
- *(systems)* Add ts type for systems
- *(ecs)* Type getEntityComponent family of functions
- *(ecs/zipper)* Merge zipper in types
- *(graphics)* Add rectangle
- *(input)* Add input library
- *(core)* Add tickrate and fix runner
- *(game)* Create pong bounce system
- *(game)* Create pong players with background
- *(game)* Add inputs in pong
- *(graphics)* Add dynamic size handle of canvas
- *(common)* Add dependencies handler
- Add dependencies to current libs
- Add dependencies handling
- *(core)* Add default libraries to constructor
- *(sound)* Init basic sound library
- *(sound)* Add sound playing
- *(sound)* Add basic sound playing to example
- *(app)* Add the ability to mute and unmute sounds
- *(core)* Enhance type safety and execution context handling
- *(config)* Add initial configuration for libraries
- *(common, core, config)* Introduce configuration registry and validation system
- *(core)* Add `class-transformer` and `class-validator` dependencies for validation utilities
- *(music)* Init basic music library
- *(music)* Finish music library and add an interface for mutable libraries
- *(ci)* Add build step to GitHub Actions tests workflow
- *(example)* Update `pong` game mechanics and graphics integration
- *(systems)* Start adding context to systems
- *(ecs)* Add ecs context to the systems

### Miscellaneous Tasks

- Fix idea
- *(ecs)* Change idea name
- Add idea to common and core
- Add current state of graphics library
- Remove bun lock that was breaking unit tests
- *(husky)* Update pre-push and commit-msg scripts for pnpm compatibility
- *(config)* Update nx and gitignore configurations, adjust prettierignore rules
- *(example)* Update `pong` example to use workspace dependencies and refine configurations
- *(husky)* Simplify pre-push script by adjusting pnpm command
- Migrate to shared ESLint and Prettier configurations, remove package-specific configs
- Remove `pnpm-lock.yaml` to decouple dependency locking from the workspace configuration
- Migrate packages to shared ESLint and Prettier configs
- Remove unnecessary `@types/node` and `typescript` dependencies from `packages/input`
- Update Jest configs and refine tsconfig paths across packages
- *(example/pong)* Update dependencies, and migrate to shared ESLint & Prettier configs
- *(example/template)* Update dependency locking to workspace resolution
- Prepare first release

### Refactor

- *(graphics-2d)* Remove custom rendering core and replace with `Konva`

### Testing

- *(ecs/sparseArray)* Add unit tests for sparse array
- *(libs)* Include ConfigRegistry in library initialization test

### Build

- *(ecs)* Add standalone build and html and js build
- Update dependencies
- Upgrade dependencies and engines to latest versions

### Ci

- Setup tests ci
- Add linting to ci
- Branch name was on master isntead of main
- *(release)* Create a release workflow
