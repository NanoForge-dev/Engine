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

type EmbindString = ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string;
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

export interface MapStringSparseArray extends ClassHandle {
  keys(): VectorString;
  size(): number;
  get(_0: EmbindString): SparseArray | undefined;
  set(_0: EmbindString, _1: SparseArray | null): void;
}

export interface VectorString extends ClassHandle {
  size(): number;
  get(_0: number): EmbindString | undefined;
  push_back(_0: EmbindString): void;
  resize(_0: number, _1: EmbindString): void;
  set(_0: number, _1: EmbindString): boolean;
}

export interface Zipper extends ClassHandle {
  next(): any;
  getValue(): any;
}

export interface IndexedZipper extends ClassHandle {
  next(): any;
  getValue(): any;
}

export interface Registry extends ClassHandle {
  registerComponent(_0: {name: string, [key: string]: any}): SparseArray;
  getComponentsConst(_0: {name: string, [key: string]: any}): SparseArray;
  getComponents(_0: {name: string, [key: string]: any}): SparseArray;
  spawnEntity(): Entity;
  killEntity(_0: Entity): void;
  clearEntities(): void;
  removeComponent(_0: Entity, _1: {name: string, [key: string]: any}): void;
  runSystems(): void;
  clearSystems(): void;
  entityFromIndex(_0: number): Entity;
  removeSystem(_0: number): void;
  maxEntities(): number;
  getEntityComponentConst(_0: Entity, _1: {name: string, [key: string]: any}): any | undefined;
  getEntityComponent(_0: Entity, _1: {name: string, [key: string]: any}): any | undefined;
  addComponent(_0: Entity, _1: {name: string, [key: string]: any}): any | undefined;
  addSystem(_0: any): void;
  getZipper(_0: any): Zipper;
  getIndexedZipper(_0: any): IndexedZipper;
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
  MapStringSparseArray: {
    new(): MapStringSparseArray;
  };
  VectorString: {
    new(): VectorString;
  };
  Zipper: {
    new(_0: MapStringSparseArray): Zipper;
  };
  IndexedZipper: {
    new(_0: MapStringSparseArray): IndexedZipper;
  };
  Registry: {
    new(): Registry;
  };
}

export type MainModule = WasmModule & typeof RuntimeExports & EmbindModule;
export default function MainModuleFactory (options?: unknown): Promise<MainModule>;
