import { Hitbox, Position } from "./components";
import { ecsLibrary } from "./index";

export function checkCollisions(entity: any) {
  const entities = ecsLibrary.getZipper([Hitbox, Position]);

  const { x, y } = entity.Position;
  const { width, height } = entity.Hitbox;

  for (const e of entities) {
    if (e === undefined) continue;
    const { x: ox, y: oy } = e.Position;
    const { width: ow, height: oh } = e.Hitbox;

    if (
      e.Position != entity.Position &&
      e.Hitbox != entity.Hitbox &&
      x < ox + ow &&
      x + width > ox &&
      y < oy + oh &&
      y + height > oy
    ) {
      return true;
    }
  }

  return false;
}
