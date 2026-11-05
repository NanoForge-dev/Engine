import type { Context } from "@nanoforge-dev/common";
import type { Registry } from "@nanoforge-dev/ecs/client";
import { MathUtils } from "@nanoforge-dev/graphics-3d/three";

import { Model, Spin } from "../components/components";

/** Turns every model that has a `Spin`. */
export function spin(registry: Registry, ctx: Context) {
  const seconds = ctx.app.delta / 1000;

  registry.getZipper([Model, Spin]).forEach(({ Model, Spin }) => {
    Model.object.rotation.x += MathUtils.degToRad(Spin.x) * seconds;
    Model.object.rotation.y += MathUtils.degToRad(Spin.y) * seconds;
    Model.object.rotation.z += MathUtils.degToRad(Spin.z) * seconds;
  });
}
