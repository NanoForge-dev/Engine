import { Hitbox, Position } from "./components";
import { ecsLibrary } from "./index";

export function checkCollisions(entity: any) {
  const entities = ecsLibrary.getZipper([Hitbox, Position]);

  const { x, y } = entity.Position;
  const { width, height } = entity.Hitbox;

  for (const e of entities) {
    if (e === undefined) continue;
    const { x: ex, y: ey } = e.Position;
    const { width: ew, height: eh } = e.Hitbox;

    if (
      e.Position != entity.Position &&
      e.Hitbox != entity.Hitbox &&
      x < ex + ew &&
      x + width > ex &&
      y < ey + eh &&
      y + height > ey
    ) {
      return true;
    }
  }

  return false;
}
