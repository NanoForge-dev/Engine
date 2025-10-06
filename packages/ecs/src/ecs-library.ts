import { type AssetManagerLibrary } from "@nanoforge/asset-manager";
import {
  ASSET_MANAGER_LIBRARY,
  BaseComponentSystemLibrary,
  GRAPHICS_LIBRARY,
  type InitContext,
} from "@nanoforge/common";

import type { Entity, MainModule, Registry, SparseArray } from "../lib";
import { Module } from "../lib";
import { type ECSContext } from "./ecs-context.type";

export type Component = { name: string; [key: string]: any };
export type System = (registry: Registry) => void;

export class ECSLibrary extends BaseComponentSystemLibrary {
  private module: MainModule;
  private registry: Registry;
  private readonly path: string = "libecs.wasm";

  constructor() {
    super({
      dependencies: [ASSET_MANAGER_LIBRARY],
      runAfter: [GRAPHICS_LIBRARY],
    });
  }

  get name(): string {
    return "ECSLibrary";
  }

  async init(context: InitContext): Promise<void> {
    const wasmFile = await context.libraries
      .getAssetManager<AssetManagerLibrary>()
      .library.getWasm(this.path);
    this.module = await Module({ locateFile: () => wasmFile.path });
    this.registry = new this.module.Registry();
  }

  async run(ctx: ECSContext): Promise<void> {
    this.runSystems(ctx);
  }

  addComponent(entity: Entity, component: Component): void {
    this.registry.addComponent(entity, component);
  }

  spawnEntity(): Entity {
    return this.registry.spawnEntity();
  }

  getComponents(component: Component): SparseArray {
    return this.registry.getComponents(component);
  }

  removeComponent(entity: Entity, component: Component): void {
    this.registry.removeComponent(entity, component);
  }

  getEntityComponent(entity: Entity, component: Component): Component | undefined {
    return this.registry.getEntityComponent(entity, component);
  }

  getEntityComponentConst(entity: Entity, component: Component): Component | undefined {
    return this.registry.getEntityComponentConst(entity, component);
  }

  clearEntities(): void {
    this.registry.clearEntities();
  }

  runSystems(ctx: ECSContext): void {
    this.registry.runSystems(ctx);
  }

  clearSystems(): void {
    this.registry.clearSystems();
  }

  removeSystem(system: any): void {
    this.registry.removeSystem(system);
  }

  registerComponent(component: any): SparseArray {
    return this.registry.registerComponent(component);
  }

  entityFromIndex(index: number): Entity {
    return this.registry.entityFromIndex(index);
  }

  killEntity(entity: Entity): void {
    this.registry.killEntity(entity);
  }

  maxEntities(): number {
    return this.registry.maxEntities();
  }

  addSystem(system: System): void {
    this.registry.addSystem(system);
  }

  getZipper(types: [Component, ...Component[]]): [any, ...any[]] {
    return this.registry.getZipper(types);
  }
}
