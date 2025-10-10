import { type ECSContext, type ECSRegistry } from "@nanoforge/ecs";
import { type InputLibrary } from "@nanoforge/input";
import { type SoundLibrary } from "@nanoforge/sound";

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

export function move(registry: ECSRegistry) {
  const entities = registry.getZipper([Bounce, Position, Velocity]);

  entities.forEach((entity) => {
    entity.Position.x += entity.Velocity.x;
    entity.Position.y += entity.Velocity.y;
  });
}

export function bounce(registry: ECSRegistry, ctx: ECSContext) {
  const entities = registry.getZipper([Bounce, Position, Velocity]);

  entities.forEach((entity) => {
    if (entity.Position.x >= 1800 || entity.Position.x <= 100) {
      entity.Velocity.x = -entity.Velocity.x;

      ctx.libraries.getSound<SoundLibrary>().library.play("test");
    }
    if (entity.Position.y >= 1000 || entity.Position.y <= 100) {
      entity.Velocity.y = -entity.Velocity.y;

      ctx.libraries.getSound<SoundLibrary>().library.play("test");
    }
  });
}

export function controlPlayer(registry: ECSRegistry, ctx: ECSContext) {
  const entities = registry.getZipper([Controller, Position, Hitbox, Velocity]);

  entities.forEach((entity) => {
    if (
      ctx.libraries.getInput<InputLibrary>().library.isKeyPressed(entity.Controller.up) &&
      !checkCollisions(registry, entity)
    ) {
      entity.Position.y -= entity.Velocity.y;
    } else {
      entity.Position.y += entity.Velocity.y;
    }
    if (
      ctx.libraries.getInput<InputLibrary>().library.isKeyPressed(entity.Controller.down) &&
      !checkCollisions(registry, entity)
    ) {
      entity.Position.y += entity.Velocity.y;
    } else {
      entity.Position.y -= entity.Velocity.y;
    }
  });
}

export function drawCircle(registry: ECSRegistry) {
  const entities = registry.getZipper([CircleComponent, Position]);

  entities.forEach((entity) => {
    const pos = entity.Position;
    entity.CircleComponent.component.setPosition(pos);
  });
}

export function moveRectangle(registry: ECSRegistry) {
  const entities = registry.getZipper([RectangleComponent, Position, Hitbox]);

  entities.forEach((entity) => {
    const pos = entity.Position;
    (entity.RectangleComponent as RectangleComponent).component.setPosition(pos);
  });
}
