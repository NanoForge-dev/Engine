import type { Registry } from "../../lib/web/libecs";

/** Public surface of `EcsLibrary`, exposed on `Context.ecs`. */
export interface EcsContextApi {
  /** The WASM-backed entity/component registry. */
  readonly registry: Registry;
}
