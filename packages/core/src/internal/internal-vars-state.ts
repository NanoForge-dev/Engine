import type { VarsContext } from "@nanoforge-dev/common";

/**
 * The only place `vars`' storage lives.
 *
 * @remarks
 * Unlike `InternalAppState`, mutation (`set`) is intentionally public on
 * the returned `VarsContext` — `vars` is the dev-editable half of `Context`.
 */
export class InternalVarsState {
  private readonly map: Map<string, unknown>;

  constructor(initial?: Record<string, unknown>) {
    this.map = new Map(Object.entries(initial ?? {}));
  }

  asVarsContext(): VarsContext {
    return {
      get: (key: string) => this.map.get(key),
      set: (key: string, value: unknown) => {
        this.map.set(key, value);
      },
    };
  }
}
