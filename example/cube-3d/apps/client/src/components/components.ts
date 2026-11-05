import type { Object3D } from "@nanoforge-dev/graphics-3d/three";

/** The 3D object an entity shows. Add the object to `ctx.graphics.scene` to render it. */
export class Model {
  name = "Model";

  constructor(public object: Object3D) {}
}

/** Rotation speed around each axis, in degrees per second. */
export class Spin {
  name = "Spin";

  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}
}
