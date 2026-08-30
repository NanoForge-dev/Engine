import { default as Module } from "../../lib/web/libecs";
import "../shared/context-augmentation";
import { EcsLibrary as BaseEcsLibrary } from "../shared/ecs-library";

/** Client-side ECS library — loads the browser-targeted compiled WASM module. */
export class EcsLibrary extends BaseEcsLibrary {
  constructor() {
    super(Module);
  }
}

export type { EcsContextApi } from "../shared/ecs-context.type";
export type { Component, Entity, Registry, SparseArray, System } from "../../lib/web/libecs";
