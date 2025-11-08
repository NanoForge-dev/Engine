// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
interface WasmModule {
}

export interface ClassHandle {
  isAliasOf(other: ClassHandle): boolean;
  delete(): void;
  deleteLater(): this;
  isDeleted(): boolean;
  // @ts-ignore - If targeting lower than ESNext, this symbol might not exist.
  [Symbol.dispose](): void;
  clone(): this;
}
export interface container extends ClassHandle {
  size(): number;
  get(_0: number): any | undefined | undefined;
  push_back(_0?: any): void;
  resize(_0: number, _1?: any): void;
  set(_0: number, _1?: any): boolean;
}

export interface SparseArray extends ClassHandle {
  setByCopy(_0: SparseArray): SparseArray;
  setByMove(_0: SparseArray): SparseArray;
  clear(): void;
  empty(): boolean;
  erase(_0: number): void;
  size(): number;
  resize(_0: number): void;
  getIndex(_0?: any): number;
  getConst(_0: number): any | undefined;
  get(_0: number): any | undefined;
  insertAt(_0: number, _1?: any): any | undefined;
  insertAt(_0: number, _1?: any): any | undefined;
  set(_0: number, _1?: any): void;
}

export interface Entity extends ClassHandle {
  getId(): number;
}

type Component = {name: string, [key: string]: any};

type System = (registry: Registry, ctx: any) => void;

export interface Registry extends ClassHandle {
  registerComponent(_0: Component): SparseArray;
  getComponentsConst(_0: Component): SparseArray;
  getComponents(_0: Component): SparseArray;
  spawnEntity(): Entity;
  killEntity(_0: Entity): void;
  clearEntities(): void;
  removeComponent(_0: Entity, _1: Component): void;
  addSystem(_0: System): void;
  clearSystems(): void;
  entityFromIndex(_0: number): Entity;
  removeSystem(_0: number): void;
  maxEntities(): number;
  getEntityComponentConst(_0: Entity, _1: Component): any | undefined;
  getEntityComponent(_0: Entity, _1: Component): any | undefined;
  addComponent(_0: Entity, _1: Component): any | undefined;
  runSystems(_0: any): void;
  getZipper(_0: Component[]): any;
}

interface EmbindModule {
  container: {
    new(): container;
  };
  SparseArray: {
    new(): SparseArray;
  };
  Entity: {
    new(_0: number): Entity;
  };
  Registry: {
    new(): Registry;
  };
}

export type MainModule = WasmModule & EmbindModule;
export default function MainModuleFactory (options?: unknown): Promise<MainModule>;
