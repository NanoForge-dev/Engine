import { Vector3 } from "@nanoforge-dev/graphics-3d/three";

import { FIELD } from "../../../shared/protocol";

/** World units per field unit: the 1920 × 1080 field is 19.2 × 10.8 in 3D. */
export const SCALE = 1 / 100;

/**
 * Field point → world point. The field lies on the ground (y = 0), centered
 * on the origin: field x goes along world x, field y (down) along world z.
 */
export const fieldToWorld = (x: number, y: number, height = 0, target = new Vector3()): Vector3 =>
  target.set((x - FIELD.width / 2) * SCALE, height, (y - FIELD.height / 2) * SCALE);
