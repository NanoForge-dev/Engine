import { Bounce, CircleComponent, Position, RectangleComponent, Velocity } from "./components";
import { ecsLibrary, graphics } from "./index";

let lastFrame = 0;

export function move() {
  const entities = ecsLibrary.getZipper([Position, Velocity]);

  entities.forEach((entity) => {
    entity.Position.x += entity.Velocity.x;
    entity.Position.y += entity.Velocity.y;
  });
}

export function bounce() {
  const entities = ecsLibrary.getZipper([Position, Bounce, Velocity]);

  entities.forEach((entity) => {
    if (entity.Position.x >= 1.6 || entity.Position.x <= -1.6) {
      entity.Velocity.x = -entity.Velocity.x;
    }
    if (entity.Position.y >= 1 || entity.Position.y <= -1) {
      entity.Velocity.y = -entity.Velocity.y;
    }
  });
}

export function drawCircle() {
  const entities = ecsLibrary.getZipper([CircleComponent, Position]);

  entities.forEach((entity) => {
    const pos = entity.Position;
    console.log(entity.CircleComponent);
    entity.CircleComponent.component.setPosition(pos);
    graphics.getWindow().draw(entity.CircleComponent.component);
  });
}

export function drawRectangle() {
  const entities = ecsLibrary.getZipper([RectangleComponent]);

  entities.forEach((entity) => {
    graphics.getWindow().draw(entity.RectangleComponent.component);
  });
}

export function framerate(rate: number) {
  const frameDuration = 1000 / rate;
  let currentFrame = performance.now();
  let elapsedTime = currentFrame - lastFrame;

  while (elapsedTime < frameDuration) {
    currentFrame = performance.now();
    elapsedTime = currentFrame - lastFrame;
  }
  lastFrame = performance.now();
}
