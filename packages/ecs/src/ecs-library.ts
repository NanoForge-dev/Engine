import type { ILibrary } from "@nanoforge/common";

import Module from "../public/libecs.js";
import type { Entity, MainModule, Registry, SparseArray } from "../public/libecs.js";

function cleanPath(p: string): string {
  if (p.endsWith("/")) {
    return p.slice(0, p.length - 1);
  }
  return p;
}

export class ECSLibrary implements ILibrary {
  name: string = "ECS";
  module: MainModule;
  registry: Registry;
  path: string;

  constructor(path: string) {
    this.path = path;
  }

  init(): Promise<void> {
    return Module({ locateFile: (file: string) => `${cleanPath(this.path)}/${file}` }).then(
      (module) => {
        this.module = module;
        this.registry = new module.Registry();
        return Promise.resolve();
      },
    );
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
}
