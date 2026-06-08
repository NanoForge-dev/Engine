import { type INetworkLibrary } from "../interfaces";
import { Library } from "../library";

/**
 * Abstract base class for network libraries.
 *
 * @remarks
 * Extend this class to implement a custom network library and register it with
 * `NanoforgeApplication.useNetwork`.  The built-in implementations are
 * `NetworkClientLibrary` and `NetworkServerLibrary`.
 */
export abstract class BaseNetworkLibrary extends Library implements INetworkLibrary {}
