import {
  type AppContext,
  type Context,
  type Library,
  NfDuplicateLibraryException,
  type VarsContext,
} from "@nanoforge-dev/common";

import { orderByDependencies, orderByRunSequence } from "./ordering";

const RESERVED_KEYS = new Set(["app", "vars", "assets"]);

/**
 * Owns every registered library, enforces key uniqueness, and assembles
 * `Context` from their `expose()` results.
 *
 * @remarks
 * Not exported from `@nanoforge-dev/core` — purely internal to
 * `NanoforgeApplication`.
 */
export class LibraryRegistry {
  private readonly libraries = new Map<string, Library>();

  /**
   * Registers the mandatory built-in asset library, bypassing the
   * reserved-key check that applies to `.use()`.
   */
  registerBuiltin(library: Library): void {
    this.libraries.set(library.key, library);
  }

  register(library: Library): void {
    if (RESERVED_KEYS.has(library.key) || this.libraries.has(library.key)) {
      throw new NfDuplicateLibraryException(library.key);
    }
    this.libraries.set(library.key, library);
  }

  getAll(): Library[] {
    return [...this.libraries.values()];
  }

  getOrderedForInit(): Library[] {
    return orderByDependencies(this.getAll());
  }

  getOrderedForRun(): Library[] {
    return orderByRunSequence(this.getAll());
  }

  buildContext(app: AppContext, vars: VarsContext): Context {
    const ctx: Record<string, any> = { app, vars };
    for (const library of this.getAll()) {
      const exposed = library.expose();
      if (exposed !== undefined) ctx[library.key] = exposed;
    }
    return ctx as Context;
  }
}
