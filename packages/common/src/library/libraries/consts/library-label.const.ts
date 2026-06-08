/**
 * Registration symbol for the component-system (ECS) library slot.
 *
 * @remarks
 * Pass this symbol to `NanoforgeApplication.use` when registering a
 * custom component-system library, or use the shorthand
 * `NanoforgeApplication.useComponentSystem`.
 */
export const COMPONENT_SYSTEM_LIBRARY = Symbol("COMPONENT_SYSTEM_LIBRARY");

/**
 * Registration symbol for the graphics library slot.
 *
 * @remarks
 * Pass this symbol to `NanoforgeClient.useGraphics` or use it as a
 * dependency symbol in a custom library's `ILibraryOptions.dependencies`.
 */
export const GRAPHICS_LIBRARY = Symbol("GRAPHICS_LIBRARY");

/**
 * Registration symbol for the network library slot.
 *
 * @remarks
 * Pass this symbol to `NanoforgeApplication.useNetwork` or use it as a
 * dependency symbol in a custom library's `ILibraryOptions.dependencies`.
 */
export const NETWORK_LIBRARY = Symbol("NETWORK_LIBRARY");

/**
 * Registration symbol for the sound library slot.
 *
 * @remarks
 * Pass this symbol to `NanoforgeClient.useSound` or use it as a
 * dependency symbol in a custom library's `ILibraryOptions.dependencies`.
 */
export const SOUND_LIBRARY = Symbol("SOUND_LIBRARY");

/**
 * Registration symbol for the music library slot.
 *
 * @remarks
 * Pass this symbol to `NanoforgeApplication.use` with a custom music
 * library or use it as a dependency symbol in
 * `ILibraryOptions.dependencies`.
 */
export const MUSIC_LIBRARY = Symbol("MUSIC_LIBRARY");

/**
 * Registration symbol for the asset-manager library slot.
 *
 * @remarks
 * Pass this symbol to `NanoforgeApplication.useAssetManager` or use it
 * as a dependency in a custom library's `ILibraryOptions.dependencies`.
 */
export const ASSET_MANAGER_LIBRARY = Symbol("ASSET_MANAGER_LIBRARY");

/**
 * Registration symbol for the input library slot.
 *
 * @remarks
 * Pass this symbol to `NanoforgeClient.useInput` or use it as a
 * dependency symbol in a custom library's `ILibraryOptions.dependencies`.
 */
export const INPUT_LIBRARY = Symbol("INPUT_LIBRARY");
