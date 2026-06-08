import { NanoforgeApplication } from "./nanoforge-application";

/**
 * Server-side NanoForge application.
 *
 * @remarks
 * Extends `NanoforgeApplication` for use in Node.js server processes.
 * Create an instance via `NanoforgeFactory.createServer`.
 *
 * @example
 * ```ts
 * const server = NanoforgeFactory.createServer();
 * server.useAssetManager(new AssetManagerLibrary());
 * server.useNetwork(new NetworkServerLibrary());
 * server.useComponentSystem(new ECSServerLibrary());
 * await server.init(`files, env `);
 * server.run();
 * ```
 */
export class NanoforgeServer extends NanoforgeApplication {}
