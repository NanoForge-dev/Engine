import { type Entity, type MainModule, Module, type Registry, type SparseArray } from "@lib";
import { type AssetManagerLibrary } from "@nanoforge/asset-manager";
import { BaseComponentSystemLibrary, type InitContext } from "@nanoforge/common";

export class ECSLibrary extends BaseComponentSystemLibrary {
  name: string = "ECSLibrary";
  module: MainModule;
  registry: Registry;
  path: string = "libecs.wasm";

  async init(context: InitContext): Promise<void> {
    const wasmFile = await context.libraries
      .getAssetManager<AssetManagerLibrary>()
      .library.getWasm(this.path);
    Module({ locateFile: () => wasmFile.path }).then((module) => {
      this.module = module;
      this.registry = new module.Registry();
      return Promise.resolve();
    });
  }

  async run(): Promise<void> {
    this.runSystems();
  }

  clear(): Promise<void> {
    return Promise.resolve();
  }

  addComponent(entity: Entity, component: any): void {
    this.registry.add_component(entity, component);
  }

  createEntity(): Entity {
    return this.registry.spawn_entity();
  }

  getComponents(component: any): SparseArray {
    return this.registry.get_components(component);
  }

  removeComponent(entity: Entity, component: any): void {
    this.registry.remove_component(entity, component);
  }

  getEntityComponent(entity: Entity, component: any): any | undefined {
    return this.registry.get_entity_component(entity, component);
  }

  getEntityComponentConst(entity: Entity, component: any): any | undefined {
    return this.registry.get_entity_component_const(entity, component);
  }

  clearEntities(): void {
    this.registry.clear_entities();
  }

  runSystems(): void {
    this.registry.run_systems();
  }

  clearSystems(): void {
    this.registry.clear_systems();
  }

  removeSystem(system: any): void {
    this.registry.remove_system(system);
  }

  registerComponent(component: any): SparseArray {
    return this.registry.register_component(component);
  }

  entityFromIndex(index: number): Entity {
    return this.registry.entity_from_index(index);
  }

  killEntity(entity: Entity): void {
    this.registry.kill_entity(entity);
  }

  maxEntities(): number {
    return this.registry.max_entities();
  }

  addSystem(system: any): void {
    this.registry.add_system(system);
  }
}
