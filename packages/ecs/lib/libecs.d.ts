// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
declare namespace RuntimeExports {
    let HEAPF32: any;
    let HEAPF64: any;
    let HEAP_DATA_VIEW: any;
    let HEAP8: any;
    let HEAPU8: any;
    let HEAP16: any;
    let HEAPU16: any;
    let HEAP32: any;
    let HEAPU32: any;
    let HEAP64: any;
    let HEAPU64: any;
}
interface WasmModule {
}

export interface ClassHandle {
  isAliasOf(other: ClassHandle): boolean;
  delete(): void;
  deleteLater(): this;
  isDeleted(): boolean;
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

export interface Registry extends ClassHandle {
  registerComponent(_0: {name: string, [key: string]: any}): SparseArray;
  getComponentsConst(_0: {name: string, [key: string]: any}): SparseArray;
  getComponents(_0: {name: string, [key: string]: any}): SparseArray;
  spawnEntity(): Entity;
  killEntity(_0: Entity): void;
  clearEntities(): void;
  removeComponent(_0: Entity, _1: {name: string, [key: string]: any}): void;
  addSystem(_0: (registry: Registry) => void): void;
  runSystems(): void;
  clearSystems(): void;
  entityFromIndex(_0: number): Entity;
  removeSystem(_0: number): void;
  maxEntities(): number;
  getEntityComponentConst(_0: Entity, _1: {name: string, [key: string]: any}): any | undefined;
  getEntityComponent(_0: Entity, _1: {name: string, [key: string]: any}): any | undefined;
  addComponent(_0: Entity, _1: {name: string, [key: string]: any}): any | undefined;
  getZipper(_0: any): any;
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

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
export default function MainModuleFactory (options?: unknown): Promise<MainModule>;
