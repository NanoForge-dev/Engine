// @ts-ignore
import "../lib/libecs.wasm";

export type {
  Component,
  EditorComponentManifest,
  EditorSystemManifest,
  System,
  Registry,
  Entity,
  SparseArray,
} from "@nanoforge-dev/ecs-lib";

export { ECSClientLibrary } from "./ecs-client-library";
