import type { ApplicationOptions } from "./application-options.type";
import { NanoforgeClient } from "./nanoforge-client";
import { NanoforgeServer } from "./nanoforge-server";

class NanoforgeFactoryStatic {
  /**
   * Create a new client-side NanoForge application.
   *
   * @remarks
   * Returns a `NanoforgeClient` on which you can call
   * `use` before calling `init` and `run`.
   *
   * @param options - Optional application settings (e.g. tickRate).
   * @returns A pre-configured `NanoforgeClient` instance.
   *
   * @example
   * ```ts
   * const client = NanoforgeFactory.createClient(`tickRate: 60 `);
   * ```
   */
  createClient(options?: Partial<ApplicationOptions>): NanoforgeClient {
    return new NanoforgeClient(options);
  }

  /**
   * Create a new server-side NanoForge application.
   *
   * @remarks
   * Returns a `NanoforgeServer` on which you can call
   * `use` before calling `init` and `run`.
   *
   * @param options - Optional application settings (e.g. tickRate).
   * @returns A pre-configured `NanoforgeServer` instance.
   *
   * @example
   * ```ts
   * const server = NanoforgeFactory.createServer(`tickRate: 20 `);
   * ```
   */
  createServer(options?: Partial<ApplicationOptions>): NanoforgeServer {
    return new NanoforgeServer(options);
  }
}

/**
 * Singleton factory for creating NanoForge client and server applications.
 *
 * @remarks
 * Use `NanoforgeFactory.createClient` or
 * `NanoforgeFactory.createServer` to obtain a new application instance,
 * then attach libraries and call `init` / `run`.
 *
 * @example
 * ```ts
 * const client = NanoforgeFactory.createClient();
 * ```
 */
export const NanoforgeFactory = new NanoforgeFactoryStatic();
