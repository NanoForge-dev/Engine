import type { Context } from "../context";

/**
 * Declares a library's context key, tying its runtime key to the type-level
 * `Context` augmentation so the two can't silently desync.
 *
 * @remarks
 * Only accepts a key that is already a member of `Context` at the call
 * site — which means the library's own `declare module "@nanoforge-dev/common"
 * { interface Context { ... } }` augmentation must be part of the same
 * compilation unit. As a side effect, two libraries whose augmentations
 * declare the same key with incompatible shapes will fail to compile
 * together, catching accidental key collisions at build time.
 *
 * @example
 * ```ts
 * class MyLibrary extends Library {
 *   readonly key = defineLibraryKey("my");
 * }
 *
 * declare module "@nanoforge-dev/common" {
 *   interface Context {
 *     my: MyContextApi;
 *   }
 * }
 * ```
 */
export const defineLibraryKey = <K extends keyof Context & string>(key: K): K => key;
