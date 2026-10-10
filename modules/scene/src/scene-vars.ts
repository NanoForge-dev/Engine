import type { Scene } from "./scene";

/**
 * Types of the scene vars, by key.
 *
 * @remarks
 * Empty by default: any key holds `unknown`. Games type their vars by
 * augmenting it:
 *
 * ```ts
 * declare module "@nanoforge-dev/scene" {
 *   interface SceneVars {
 *     score: number;
 *   }
 * }
 * ```
 */
export interface SceneVars {}

/** A var's key: a typed one from `SceneVars`, or any string. */
export type SceneVarKey = keyof SceneVars | (string & {});

/** A var's value: its type in `SceneVars`, `unknown` otherwise. */
export type SceneVarValue<K> = K extends keyof SceneVars ? SceneVars[K] : unknown;

/** Options of `init` and `set`. */
export interface SceneVarOptions {
  /** Keeps the var when the scene that made it is unloaded. */
  persistent?: boolean;
}

/**
 * Vars kept by the scene manager, read and changed by scenes and systems
 * (`ctx.scenes.vars`).
 *
 * @remarks
 * A var belongs to the scene that made it: the scene being loaded or
 * unloaded when it was made, or else the current scene. It is removed when
 * that scene is unloaded, unless made `persistent`. A var made while no
 * scene is loaded belongs to none.
 */
export interface SceneVarsApi {
  /**
   * Makes a var with this value, unless it already exists.
   *
   * @returns The var's value: `value`, or the existing one.
   */
  init<K extends SceneVarKey>(
    key: K,
    value: SceneVarValue<K>,
    options?: SceneVarOptions,
  ): SceneVarValue<K>;
  /** Changes a var's value. Makes it like `init` when it does not exist yet. */
  set<K extends SceneVarKey>(key: K, value: SceneVarValue<K>, options?: SceneVarOptions): void;
  /** A var's value, or `undefined` when it does not exist. */
  get<K extends SceneVarKey>(key: K): SceneVarValue<K> | undefined;
  /** Whether the var exists. */
  has(key: SceneVarKey): boolean;
  /**
   * Removes a var.
   *
   * @returns Whether it existed.
   */
  remove(key: SceneVarKey): boolean;
  /** Keys of every var. */
  keys(): string[];
}

interface SceneVar {
  value: unknown;
  owner: Scene<never> | undefined;
  persistent: boolean;
}

/** A var, as `SceneVarsStore.entries` lists it. */
export interface SceneVarEntry {
  readonly key: string;
  readonly value: unknown;
  readonly owner: Scene<never> | undefined;
  readonly persistent: boolean;
}

/** Storage of the scene vars, with the scene each one belongs to. */
export class SceneVarsStore {
  private readonly _vars = new Map<string, SceneVar>();
  private _api?: SceneVarsApi;

  /** @param owner - The scene a var made now belongs to. */
  constructor(private readonly owner: () => Scene<never> | undefined) {}

  init(key: string, value: unknown, options?: SceneVarOptions): unknown {
    const existing = this._vars.get(key);
    if (existing) return existing.value;
    const persistent = options?.persistent === true;
    this._vars.set(key, { value, owner: persistent ? undefined : this.owner(), persistent });
    return value;
  }

  set(key: string, value: unknown, options?: SceneVarOptions): void {
    const existing = this._vars.get(key);
    if (!existing) {
      this.init(key, value, options);
      return;
    }
    existing.value = value;
    if (options?.persistent) {
      existing.owner = undefined;
      existing.persistent = true;
    }
  }

  get(key: string): unknown {
    return this._vars.get(key)?.value;
  }

  has(key: string): boolean {
    return this._vars.has(key);
  }

  remove(key: string): boolean {
    return this._vars.delete(key);
  }

  keys(): string[] {
    return [...this._vars.keys()];
  }

  /** Every var, in the order they were made. */
  entries(): SceneVarEntry[] {
    return [...this._vars].map(([key, { value, owner, persistent }]) => ({
      key,
      value,
      owner,
      persistent,
    }));
  }

  /** Removes the vars that belong to `scene`. */
  removeOwnedBy(scene: Scene<never>): void {
    for (const [key, entry] of this._vars) if (entry.owner === scene) this._vars.delete(key);
  }

  clear(): void {
    this._vars.clear();
  }

  api(): SceneVarsApi {
    return (this._api ??= {
      init: (key, value, options) => this.init(key, value, options) as never,
      set: (key, value, options) => this.set(key, value, options),
      get: (key) => this.get(key) as never,
      has: (key) => this.has(key),
      remove: (key) => this.remove(key),
      keys: () => this.keys(),
    });
  }
}
