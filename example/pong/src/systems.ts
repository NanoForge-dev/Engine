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
import { ecsLibrary, graphics, inputs } from "./index";

export function move() {
  const entities = ecsLibrary.getZipper([Bounce, Position, Velocity]);

  entities.forEach((entity) => {
    entity.Position.x += entity.Velocity.x;
    entity.Position.y += entity.Velocity.y;
  });
}

export function bounce() {
  const entities = ecsLibrary.getZipper([Bounce, Position, Velocity, Hitbox]);

  entities.forEach((entity) => {
    if (checkCollisions(entity)) {
      entity.Velocity.x = -entity.Velocity.x;
    }
    if (checkCollisions(entity)) {
      entity.Velocity.y = -entity.Velocity.y;
    }
  });
}

export function controlPlayer() {
  const entities = ecsLibrary.getZipper([Controller, Position, Hitbox, Velocity]);

  entities.forEach((entity) => {
    if (inputs.isKeyPressed(entity.Controller.up) && !checkCollisions(entity)) {
      entity.Position.y += entity.Velocity.y;
      if (checkCollisions(entity)) {
        entity.Position.y -= entity.Velocity.y;
      }
    }
    if (inputs.isKeyPressed(entity.Controller.down) && !checkCollisions(entity)) {
      entity.Position.y -= entity.Velocity.y;
      if (checkCollisions(entity)) {
        entity.Position.y += entity.Velocity.y;
      }
    }
  });
}

export function drawCircle() {
  const entities = ecsLibrary.getZipper([CircleComponent, Position]);

  entities.forEach((entity) => {
    const pos = entity.Position;
    entity.CircleComponent.component.setPosition(pos);
    graphics.getWindow().draw(entity.CircleComponent.component);
  });
}

export function moveRectangle() {
  const entities = ecsLibrary.getZipper([RectangleComponent, Position, Hitbox]);

  entities.forEach((entity) => {
    const pos = entity.Position;
    entity.RectangleComponent.component.setMin({ x: pos.x, y: pos.y });
    entity.RectangleComponent.component.setMax({
      x: pos.x + entity.Hitbox.width,
      y: pos.y + entity.Hitbox.height,
    });
  });
}

export function drawRectangle() {
  const entities = ecsLibrary.getZipper([RectangleComponent, Hitbox]);

  entities.forEach((entity) => {
    graphics.getWindow().draw(entity.RectangleComponent.component);
  });
}

export function drawBackground(bg: any) {
  const rect = ecsLibrary.getEntityComponent(bg, RectangleComponent);
  if (rect) {
    graphics.getWindow().draw(rect.component);
  }
}
