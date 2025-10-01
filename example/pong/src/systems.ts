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
import { ecsLibrary, inputs, sounds } from "./index";

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
    if (entity.Position.x >= 1800 || entity.Position.x <= 100) {
      entity.Velocity.x = -entity.Velocity.x;

      sounds.play("test");
    }
    if (entity.Position.y >= 1000 || entity.Position.y <= 100) {
      entity.Velocity.y = -entity.Velocity.y;

      sounds.play("test");
    }
  });
}

export function controlPlayer() {
  const entities = ecsLibrary.getZipper([Controller, Position, Hitbox, Velocity]);

  entities.forEach((entity) => {
    if (inputs.isKeyPressed(entity.Controller.up) && !checkCollisions(entity)) {
      entity.Position.y -= entity.Velocity.y;
    } else {
      entity.Position.y += entity.Velocity.y;
    }
    if (inputs.isKeyPressed(entity.Controller.down) && !checkCollisions(entity)) {
      entity.Position.y += entity.Velocity.y;
    } else {
      entity.Position.y -= entity.Velocity.y;
    }
  });
}

export function drawCircle() {
  const entities = ecsLibrary.getZipper([CircleComponent, Position]);

  entities.forEach((entity) => {
    const pos = entity.Position;
    entity.CircleComponent.component.setPosition(pos);
  });
}

export function moveRectangle() {
  const entities = ecsLibrary.getZipper([RectangleComponent, Position, Hitbox]);

  console.log(entities);
  entities.forEach((entity) => {
    const pos = entity.Position;
    (entity.RectangleComponent as RectangleComponent).component.setPosition(pos);
  });
}
