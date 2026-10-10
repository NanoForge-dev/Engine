import type { Registry, System } from "../../lib/web/libecs";
import type { EditorCallSite } from "./editor-world";

/*
 * State kept on the registry object itself, under `Symbol.for` keys: the client, server and
 * scene entries are separate bundles, each with its own copy of this module, and they all see
 * the same registry.
 */
const SYSTEMS = Symbol.for("nanoforge.ecs.systems");
const SPAWN_ORIGIN = Symbol.for("nanoforge.ecs.spawn-origin");

/** Where the next `spawnEntity()` comes from, when a wrapper calls it for someone else. */
export interface SpawnOrigin {
  /** The wrapper's caller: the line that asked for the entity. */
  site?: EditorCallSite;
  /** The id of the scene that spawns it. */
  scene?: string;
}

interface HookedRegistry {
  [SYSTEMS]?: System[];
  [SPAWN_ORIGIN]?: SpawnOrigin;
}

/**
 * Keeps the list of the functions given to `addSystem`, in the registry's order, so a system can
 * be removed by function (`removeSystemFunction`). Installed by `EcsLibrary` on its registry,
 * outside the editor's own instrumentation.
 */
export const trackSystems = (registry: Registry): void => {
  const hooked = registry as unknown as HookedRegistry;
  if (hooked[SYSTEMS]) return;
  const systems: System[] = [];
  hooked[SYSTEMS] = systems;
  const add = registry.addSystem.bind(registry);
  const remove = registry.removeSystem.bind(registry);
  const clear = registry.clearSystems.bind(registry);
  Object.assign(registry, {
    addSystem(system: System): void {
      systems.push(system);
      add(system);
    },
    removeSystem(index: number): void {
      if (index >= 0 && index < systems.length) systems.splice(index, 1);
      remove(index);
    },
    clearSystems(): void {
      systems.length = 0;
      clear();
    },
  });
};

/**
 * Removes the last system added with this function.
 *
 * @returns Whether it was found (only on a registry of `EcsLibrary`).
 */
export const removeSystemFunction = (registry: Registry, system: System): boolean => {
  const systems = (registry as unknown as HookedRegistry)[SYSTEMS];
  const index = systems?.lastIndexOf(system) ?? -1;
  if (index < 0) return false;
  registry.removeSystem(index);
  return true;
};

/** Calls `spawn` with the origin of the entity it spawns, read by the editor's tracker. */
export const spawnFrom = <T>(registry: Registry, origin: SpawnOrigin, spawn: () => T): T => {
  const hooked = registry as unknown as HookedRegistry;
  hooked[SPAWN_ORIGIN] = origin;
  try {
    return spawn();
  } finally {
    hooked[SPAWN_ORIGIN] = undefined;
  }
};

/** The origin given by `spawnFrom`, if a wrapper is spawning. */
export const spawnOrigin = (registry: Registry): SpawnOrigin | undefined =>
  (registry as unknown as HookedRegistry)[SPAWN_ORIGIN];
