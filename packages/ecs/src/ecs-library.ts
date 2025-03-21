import { type AssetManagerLibrary } from "@nanoforge/asset-manager";
import { BaseComponentSystemLibrary, type InitContext } from "@nanoforge/common";

import type { Entity, MainModule, Registry, SparseArray } from "../lib";
import { Module } from "../lib";

export type Component = { name: string; [key: string]: any };
export type System = (registry: Registry) => void;

export class ECSLibrary extends BaseComponentSystemLibrary {
  private module: MainModule;
  private registry: Registry;
  private readonly path: string = "libecs.wasm";

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

  async run(): Promise<void> {
    this.runSystems();
  }

  clear(): Promise<void> {
    return Promise.resolve();
  }

  addComponent(entity: Entity, component: Component): void {
    this.registry.addComponent(entity, component);
  }

  createEntity(): Entity {
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

  runSystems(): void {
    this.registry.runSystems();
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

  getZipper(types: [Component]): [any] {
    return this.registry.getZipper(types);
  }
}
