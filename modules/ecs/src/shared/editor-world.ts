import type { Context } from "@nanoforge-dev/common";
import type { EditorContextApi } from "@nanoforge-dev/editor-lib";

import type { Component, Entity, Registry, System } from "../../lib/web/libecs";

/** Where `spawnEntity()` was called: a frame of the game's bundle (no source maps needed). */
export interface EditorCallSite {
  /** URL or path of the bundle. */
  file: string;
  line: number;
  column: number;
}

/** A JSON view of a component value. Class instances are `{ $class, ...their fields }`. */
export type EditorValue =
  null | boolean | number | string | EditorValue[] | { [key: string]: EditorValue };

export interface EditorWorldEntity {
  id: number;
  /** Absent when spawned by the editor. */
  site?: EditorCallSite;
  components: { name: string; value: Record<string, EditorValue> }[];
}

export interface EditorWorldSystem {
  index: number;
  name: string;
  enabled: boolean;
}

/** `ecs-world` event: the live world, sent when it changed, at most every `intervalMs`. */
export interface EditorWorld {
  entities: EditorWorldEntity[];
  systems: EditorWorldSystem[];
}

/** Time spent in one system over a window (ms per call). */
export interface EditorSystemTiming {
  index: number;
  name: string;
  /** Calls in the window: 0 while the system is paused by the editor. */
  calls: number;
  avg: number;
  max: number;
}

/** `ecs-system-stats` event: the time each system took, every `intervalMs`. */
export interface EditorSystemStats {
  /** Length of the window (ms). */
  windowMs: number;
  systems: EditorSystemTiming[];
}

/** Arguments of the ECS commands the editor sends while playing. */
export interface EcsEditorCommands {
  /** Sets one field of a component: entity id, component name, field, JSON value. */
  "ecs-set-component": [number, string, string, EditorValue];
  /** Adds a component of a class the game already used: entity id, class name, arguments. */
  "ecs-add-component": [number, string, EditorValue[]];
  "ecs-remove-component": [number, string];
  "ecs-spawn-entity": [];
  "ecs-remove-entity": [number];
  /** Pauses a system (index in run order), or runs it again. */
  "ecs-set-system-enabled": [number, boolean];
}

declare module "@nanoforge-dev/editor-lib" {
  interface EditorFeatures {
    /** Emit `ecs-world` events every `intervalMs` while something changed. */
    ecsWorld?: { intervalMs: number };
    /** Time each system and emit `ecs-system-stats` events every `intervalMs`. */
    ecsSystemStats?: { intervalMs: number };
  }
  interface EditorEventMap {
    "ecs-world": [EditorWorld];
    "ecs-system-stats": [EditorSystemStats];
  }
  interface EditorCommandMap {
    "ecs-set-component": EcsEditorCommands["ecs-set-component"];
    "ecs-add-component": EcsEditorCommands["ecs-add-component"];
    "ecs-remove-component": EcsEditorCommands["ecs-remove-component"];
    "ecs-spawn-entity": EcsEditorCommands["ecs-spawn-entity"];
    "ecs-remove-entity": EcsEditorCommands["ecs-remove-entity"];
    "ecs-set-system-enabled": EcsEditorCommands["ecs-set-system-enabled"];
  }
}

const MAX_DEPTH = 3;
const MAX_ITEMS = 64;

/** JSON view of a value: engine objects become `{ $class, …fields }`, functions are dropped. */
export const toEditorValue = (value: unknown, depth = 0): EditorValue => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value !== "object") return null;
  if (depth >= MAX_DEPTH) {
    const name = (value as { constructor?: { name?: string } }).constructor?.name;
    return name && name !== "Object" ? { $class: name } : null;
  }
  if (Array.isArray(value))
    return value.slice(0, MAX_ITEMS).map((item) => toEditorValue(item, depth + 1));
  const result: Record<string, EditorValue> = {};
  const name = (value as { constructor?: { name?: string } }).constructor?.name;
  if (name && name !== "Object") result.$class = name;
  let count = 0;
  for (const [key, field] of Object.entries(value as Record<string, unknown>)) {
    if (typeof field === "function" || key.startsWith("_")) continue;
    if (++count > MAX_ITEMS) break;
    result[key] = toEditorValue(field, depth + 1);
  }
  return result;
};

/** The caller of the instrumented method, from a stack trace (`at fn (file:line:col)`). */
export const callSiteOf = (stack: string | undefined): EditorCallSite | undefined => {
  // 0: "Error", 1: the wrapper, 2: its caller.
  const frame = stack?.split("\n")[2];
  const match =
    frame && /\(?((?:[a-z]+:\/\/|\/|[A-Za-z]:\\)[^)\s]*?):(\d+):(\d+)\)?\s*$/.exec(frame.trim());
  const [, file, line, column] = match ?? [];
  if (!file) return undefined;
  return { file, line: Number(line), column: Number(column) };
};

interface TrackedSystem {
  name: string;
  enabled: boolean;
  /** Timings of the current window (`ecsSystemStats`). */
  calls: number;
  total: number;
  max: number;
}

interface TrackedEntity {
  entity: Entity;
  site?: EditorCallSite;
  components: Map<string, Component>;
}

/**
 * The ECS as the editor sees it while playing (live mode): records entities with the call site
 * of their `spawnEntity()`, their components and the systems, sends the world, and applies the
 * editor's changes. Installed only when an editor started the game.
 */
export class EditorWorldTracker {
  private readonly _entities = new Map<number, TrackedEntity>();
  private readonly _systems: TrackedSystem[] = [];
  private _statsStart = 0;
  private readonly _classes = new Map<string, new (...args: unknown[]) => Component>();
  private _editor?: EditorContextApi;
  private _lastSent = 0;
  private _lastJson = "";

  constructor(private readonly _registry: Registry) {
    this._instrument();
  }

  /** Wires events and commands, once the editor is there (`__editorInit`). */
  attach(editor: EditorContextApi): void {
    if (this._editor) return;
    this._editor = editor;
    const registry = this._registry;
    editor.on("ecs-set-component", (id, name, field, value) => {
      const component = this._entities.get(id)?.components.get(name);
      if (component) (component as Record<string, unknown>)[field] = value;
    });
    editor.on("ecs-add-component", (id, name, args) => {
      const tracked = this._entities.get(id);
      const Class = this._classes.get(name);
      if (tracked && Class) registry.addComponent(tracked.entity, new Class(...args));
    });
    editor.on("ecs-remove-component", (id, name) => {
      const tracked = this._entities.get(id);
      const component = tracked?.components.get(name);
      if (tracked && component) registry.removeComponent(tracked.entity, component);
    });
    editor.on("ecs-spawn-entity", () => {
      registry.spawnEntity();
    });
    editor.on("ecs-remove-entity", (id) => {
      const tracked = this._entities.get(id);
      if (tracked) registry.killEntity(tracked.entity);
    });
    editor.on("ecs-set-system-enabled", (index, enabled) => {
      const system = this._systems[index];
      if (system) system.enabled = enabled;
    });
  }

  /** Sends the world when asked for and changed, at most every `intervalMs`. */
  tick(now: number = Date.now()): void {
    this._sendSystemStats(now);
    const interval = this._editor?.welcome?.features.ecsWorld?.intervalMs;
    if (!this._editor || interval === undefined || now - this._lastSent < interval) return;
    this._lastSent = now;
    const world = this.world();
    const json = JSON.stringify(world);
    if (json === this._lastJson) return;
    this._lastJson = json;
    this._editor.emit("ecs-world", world);
  }

  world(): EditorWorld {
    return {
      entities: [...this._entities].map(([id, tracked]) => ({
        id,
        ...(tracked.site && { site: tracked.site }),
        components: [...tracked.components].map(([name, component]) => ({
          name,
          value: toEditorValue(component) as Record<string, EditorValue>,
        })),
      })),
      systems: this._systems.map(({ name, enabled }, index) => ({ index, name, enabled })),
    };
  }

  /** Whether the editor asked for system timings (read each tick: it can change its mind). */
  private get _timing(): boolean {
    return this._editor?.welcome?.features.ecsSystemStats !== undefined;
  }

  /** Sends the timings of the window that ended, and starts the next one. */
  private _sendSystemStats(now: number): void {
    const interval = this._editor?.welcome?.features.ecsSystemStats?.intervalMs;
    if (!this._editor || interval === undefined) return;
    if (!this._statsStart) this._statsStart = now;
    const windowMs = now - this._statsStart;
    if (windowMs < interval) return;
    this._statsStart = now;
    this._editor.emit("ecs-system-stats", {
      windowMs,
      systems: this._systems.map((system, index) => {
        const timing = {
          index,
          name: system.name,
          calls: system.calls,
          avg: system.calls ? system.total / system.calls : 0,
          max: system.max,
        };
        system.calls = system.total = system.max = 0;
        return timing;
      }),
    });
  }

  private _instrument(): void {
    const registry = this._registry;
    const entities = this._entities;
    const spawn = registry.spawnEntity.bind(registry);
    const kill = registry.killEntity.bind(registry);
    const clear = registry.clearEntities.bind(registry);
    const add = registry.addComponent.bind(registry);
    const remove = registry.removeComponent.bind(registry);
    const addSystem = registry.addSystem.bind(registry);
    const clearSystems = registry.clearSystems.bind(registry);
    const systems = this._systems;
    const classes = this._classes;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const tracker = this;

    Object.assign(registry, {
      spawnEntity(): Entity {
        const site = callSiteOf(new Error().stack);
        const entity = spawn();
        entities.set(entity.getId(), { entity, ...(site && { site }), components: new Map() });
        return entity;
      },
      killEntity(entity: Entity): void {
        entities.delete(entity.getId());
        kill(entity);
      },
      clearEntities(): void {
        entities.clear();
        clear();
      },
      addComponent(entity: Entity, component: Component) {
        const tracked = entities.get(entity.getId());
        if (tracked) tracked.components.set(component.name, component);
        const Class = (component as unknown as { constructor?: unknown }).constructor;
        if (typeof Class === "function" && Class !== Object)
          classes.set(component.name, Class as new (...args: unknown[]) => Component);
        return add(entity, component);
      },
      removeComponent(entity: Entity, component: Component): void {
        entities.get(entity.getId())?.components.delete(component.name);
        remove(entity, component);
      },
      addSystem(system: System): void {
        const entry: TrackedSystem = {
          name: system.name || `system ${systems.length + 1}`,
          enabled: true,
          calls: 0,
          total: 0,
          max: 0,
        };
        systems.push(entry);
        addSystem((registryArg: Registry, ctx: Context) => {
          if (!entry.enabled) return;
          if (!tracker._timing) return system(registryArg, ctx);
          const start = performance.now();
          try {
            system(registryArg, ctx);
          } finally {
            const ms = performance.now() - start;
            entry.calls++;
            entry.total += ms;
            if (ms > entry.max) entry.max = ms;
          }
        });
      },
      clearSystems(): void {
        systems.length = 0;
        clearSystems();
      },
    });
  }
}
