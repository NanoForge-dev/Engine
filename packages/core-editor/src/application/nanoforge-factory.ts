import { type IApplicationOptions } from "../../../core/src/application/application-options.type";
import { NanoforgeClient } from "./nanoforge-client";
import { NanoforgeServer } from "./nanoforge-server";

class NanoforgeFactoryStatic {
  /**
   * Create a new editor-mode client application.
   *
   * @param options - Optional application settings (e.g. tickRate).
   * @returns A pre-configured `NanoforgeClient` instance.
   */
  createClient(options?: Partial<IApplicationOptions>): NanoforgeClient {
    return new NanoforgeClient(options);
  }

  /**
   * Create a new editor-mode server application.
   *
   * @param options - Optional application settings (e.g. tickRate).
   * @returns A pre-configured `NanoforgeServer` instance.
   */
  createServer(options?: Partial<IApplicationOptions>): NanoforgeServer {
    return new NanoforgeServer(options);
  }
}

/**
 * Singleton factory for creating editor-mode NanoForge client and server
 * applications.
 *
 * @remarks
 * Use `NanoforgeFactory.createClient` or
 * `NanoforgeFactory.createServer` to obtain an application instance that
 * accepts `IEditorRunOptions` on `init`.
 *
 * @example
 * ```ts
 * import `NanoforgeFactory ` from "@nanoforge-dev/core-editor";
 *
 * const client = NanoforgeFactory.createClient();
 * ```
 */
export const NanoforgeFactory = new NanoforgeFactoryStatic();
