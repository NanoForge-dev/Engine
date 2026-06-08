import { NanoforgeApplication } from "./nanoforge-application";

/**
 * Server-side NanoForge application for editor mode.
 *
 * @remarks
 * Extends `NanoforgeApplication` for use in server processes during
 * editor sessions.  Create via the `core-editor` `NanoforgeFactory`.
 */
export class NanoforgeServer extends NanoforgeApplication {}
