import { type IExposedLibrary } from "../bases/exposed.library.type";

/**
 * Interface for network libraries.
 *
 * @remarks
 * Implemented by `BaseNetworkLibrary` and its concrete subclasses
 * `NetworkClientLibrary` and `NetworkServerLibrary`.  Access an
 * instance via `ctx.libraries.getNetwork().library`.
 */
export interface INetworkLibrary extends IExposedLibrary {}
