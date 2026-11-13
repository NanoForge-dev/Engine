import { type Object3D } from "@nanoforge-dev/graphics-3d/three";

/**
 * A Three.js object the arrow keys turn, read by the `turnModel` system.
 *
 * @component
 * @side client
 */
export class Model {
  name = "Model";

  constructor(
    /** The object in the scene: the system turns it around its Y axis. */
    public object: Object3D,
  ) {}
}
