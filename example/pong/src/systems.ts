import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs";
import { type InputLibrary } from "@nanoforge-dev/input";
import { type SoundLibrary } from "@nanoforge-dev/sound";

import { checkCollisions } from "./collisions";
import {
  Bounce,
  CircleComponent,
  Controller,
  Hitbox,
  Position,
  RectangleComponent,
  Velocity,
} from "./components";

export function move(registry: Registry) {
  const entities = registry.getZipper([Bounce, Position, Velocity]);

  entities.forEach((entity) => {
    entity.Position.x += entity.Velocity.x;
    entity.Position.y += entity.Velocity.y;
  });
}

export function bounce(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([Bounce, Position, Velocity]);

  entities.forEach((entity) => {
    if (entity.Position.x >= 1800 || entity.Position.x <= 100) {
      entity.Velocity.x = -entity.Velocity.x;

      ctx.libs.getSound<SoundLibrary>().play("test");
    }
    if (entity.Position.y >= 1000 || entity.Position.y <= 100) {
      entity.Velocity.y = -entity.Velocity.y;
      ctx.libs.getSound<SoundLibrary>().play("test");
    }
  });
}

export function controlPlayer(registry: Registry, ctx: Context) {
  const entities = registry.getZipper([Controller, Position, Hitbox, Velocity]);

  entities.forEach((entity) => {
    if (
      ctx.libs.getInput<InputLibrary>().isKeyPressed(entity.Controller.up) &&
      !checkCollisions(registry, entity)
    ) {
      entity.Position.y -= entity.Velocity.y;
    } else {
      entity.Position.y += entity.Velocity.y;
    }
    if (
      ctx.libs.getInput<InputLibrary>().isKeyPressed(entity.Controller.down) &&
      !checkCollisions(registry, entity)
    ) {
      entity.Position.y += entity.Velocity.y;
    } else {
      entity.Position.y -= entity.Velocity.y;
    }
  });
}

export function drawCircle(registry: Registry) {
  const entities = registry.getZipper([CircleComponent, Position]);

  entities.forEach((entity) => {
    const pos = entity.Position;
    entity.CircleComponent.component.setPosition(pos);
  });
}

export function moveRectangle(registry: Registry) {
  const entities = registry.getZipper([RectangleComponent, Position, Hitbox]);

  entities.forEach((entity) => {
    const pos = entity.Position;
    (entity.RectangleComponent as RectangleComponent).component.setPosition(pos);
  });
}
