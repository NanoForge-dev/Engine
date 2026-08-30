import { default as Module } from "../../lib/node/libecs";
import "../shared/context-augmentation";
import { EcsLibrary as BaseEcsLibrary } from "../shared/ecs-library";

/** Server-side ECS library — loads the Node-targeted compiled WASM module. */
export class EcsLibrary extends BaseEcsLibrary {
  constructor() {
    super(Module);
  }
}

export type { EcsContextApi } from "../shared/ecs-context.type";
export type { Component, Entity, Registry, SparseArray, System } from "../../lib/node/libecs";
