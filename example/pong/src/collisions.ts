import { type Registry } from "@nanoforge-dev/ecs";

import { Hitbox, Position } from "./components";

export function checkCollisions(registry: Registry, entity: any) {
  const entities = registry.getZipper([Hitbox, Position]);

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
