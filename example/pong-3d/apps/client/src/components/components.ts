import type { Object3D, Vector3 } from "@nanoforge-dev/graphics-3d/three";
import type { InputEnum } from "@nanoforge-dev/input";

export class NetworkId {
  constructor(public id: number) {}
}

/** A paddle, tagged with the seat it belongs to. */
export class Paddle {
  constructor(public seat: 1 | 2) {}
}

/** Position in server field units (1920 × 1080, y down). */
export class Position {
  constructor(
    public x = 0,
    public y = 0,
  ) {}
}

/** Speed in field units per millisecond. */
export class Velocity {
  constructor(
    public x = 0,
    public y = 0,
  ) {}
}

/**
 * The 3D object drawn at the entity's `Position`. The offset goes from the
 * position to the object's center, in field units (paddles are placed by
 * their top-left corner).
 */
export class Model {
  constructor(
    public object: Object3D,
    public offsetX = 0,
    public offsetY = 0,
  ) {}
}

/**
 * The local player: which paddle it controls (0 while spectating), and the
 * keys that move it left and right on screen.
 */
export class Player {
  seat: 0 | 1 | 2 = 0;
  sent: "up" | "down" | "stop" = "stop";

  constructor(
    public left: InputEnum[],
    public right: InputEnum[],
  ) {}
}

/** Where the camera looks, eased toward its goal every tick. */
export class CameraRig {
  look: Vector3 | undefined = undefined;
}
