import type { Entity, Registry, SparseArray } from "../lib";
import { type ECSContext } from "./ecs-context.type";

export type Component = { name: string; [key: string]: any };
export type System = (registry: ECSRegistry, ctx: ECSContext) => void;

export class ECSRegistry {
  private _registry: Registry;

  constructor(registry: Registry) {
    this._registry = registry;
  }

  addComponent(entity: Entity, component: Component): void {
    return this._registry.addComponent(entity, component);
  }

  spawnEntity(): Entity {
    return this._registry.spawnEntity();
  }

  getComponents(component: Component): SparseArray {
    return this._registry.getComponents(component);
  }

  removeComponent(entity: Entity, component: Component): void {
    return this._registry.removeComponent(entity, component);
  }

  getEntityComponent(entity: Entity, component: Component): Component | undefined {
    return this._registry.getEntityComponent(entity, component);
  }

  getEntityComponentConst(entity: Entity, component: Component): Component | undefined {
    return this._registry.getEntityComponentConst(entity, component);
  }

  clearEntities(): void {
    return this._registry.clearEntities();
  }

  runSystems(ctx: ECSContext): void {
    return this._registry.runSystems(ctx);
  }

  clearSystems(): void {
    return this._registry.clearSystems();
  }

  removeSystem(system: any): void {
    return this._registry.removeSystem(system);
  }

  registerComponent(component: any): SparseArray {
    return this._registry.registerComponent(component);
  }

  entityFromIndex(index: number): Entity {
    return this._registry.entityFromIndex(index);
  }

  killEntity(entity: Entity): void {
    return this._registry.killEntity(entity);
  }

  maxEntities(): number {
    return this._registry.maxEntities();
  }

  addSystem(system: System): void {
    return this._registry.addSystem(system as unknown as (registry: Registry, ctx: any) => void);
  }

  getZipper(types: [Component, ...Component[]]): [any, ...any[]] {
    return this._registry.getZipper(types);
  }
}
