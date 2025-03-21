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
  const entities = ecsLibrary.getZipper([Bounce, Position, Velocity]);

  entities.forEach((entity) => {
    if (entity.Position.x >= 1.6 || entity.Position.x <= -1.6) {
      entity.Velocity.x = -entity.Velocity.x;
    }
    if (entity.Position.y >= 1 || entity.Position.y <= -1) {
      entity.Velocity.y = -entity.Velocity.y;
    }
  });
}

export function controlPlayer() {
  const entities = ecsLibrary.getZipper([Controller, Position, Hitbox, Velocity]);

  entities.forEach((entity) => {
    if (inputs.isKeyPressed(entity.Controller.up) && !checkCollisions(entity)) {
      entity.Position.y += entity.Velocity.y;
    } else {
      entity.Position.y -= entity.Velocity.y;
    }
    if (inputs.isKeyPressed(entity.Controller.down) && !checkCollisions(entity)) {
      entity.Position.y -= entity.Velocity.y;
    } else {
      entity.Position.y += entity.Velocity.y;
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
  const entities = ecsLibrary.getZipper([RectangleComponent]);

  entities.forEach((entity) => {
    graphics.getWindow().draw(entity.RectangleComponent.component);
  });
}
