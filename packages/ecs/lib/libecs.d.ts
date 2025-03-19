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
  get_index(_0?: any): number;
  get_const(_0: number): any | undefined;
  get(_0: number): any | undefined;
  insert_at(_0: number, _1?: any): any | undefined;
  insert_at(_0: number, _1?: any): any | undefined;
  set(_0: number, _1?: any): void;
}

export interface Entity extends ClassHandle {
  get_id(): number;
}

export interface Registry extends ClassHandle {
  spawn_entity(): Entity;
  kill_entity(_0: Entity): void;
  clear_entities(): void;
  run_systems(): void;
  clear_systems(): void;
  entity_from_index(_0: number): Entity;
  remove_system(_0: number): void;
  max_entities(): number;
  register_component(_0: any): SparseArray;
  get_components_const(_0: any): SparseArray;
  get_components(_0: any): SparseArray;
  get_entity_component_const(_0: Entity, _1: any): any | undefined;
  get_entity_component(_0: Entity, _1: any): any | undefined;
  add_component(_0: Entity, _1: any): any | undefined;
  remove_component(_0: Entity, _1: any): void;
  add_system(_0: any): void;
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
