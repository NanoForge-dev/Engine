import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import { type IRunOptions } from "@nanoforge/common";
import { NanoforgeFactory } from "@nanoforge/core";
import { ECSLibrary } from "@nanoforge/ecs";
import { Graphics2DLibrary } from "@nanoforge/graphics-2d";

export const ecsLibrary = new ECSLibrary();

export const app = NanoforgeFactory.createClient();

class Velocity {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

let lastFrame = 0;

function move() {
  const zip = ecsLibrary.getZipper([Position, Velocity]);

  for (let data = zip.getValue(); data != undefined; data = zip.next()) {
    data["Position"].x += data["Velocity"].x;
    data["Position"].y += data["Velocity"].y;
  }
}

function logger() {
  const zip = ecsLibrary.getZipper([Position]);

  for (let data = zip.getValue(); data != undefined; data = zip.next()) {
    console.log(data["Position"].x, data["Position"].y);
  }
}

function framerate(rate: number) {
  const frameDuration = 1000 / rate;
  let currentFrame = performance.now();
  let elapsedTime = currentFrame - lastFrame;

  while (elapsedTime < frameDuration) {
    currentFrame = performance.now();
    elapsedTime = currentFrame - lastFrame;
  }
  lastFrame = performance.now();
}

export const main = async (options: IRunOptions) => {
  app.useGraphics(new Graphics2DLibrary());
  app.useComponentSystem(ecsLibrary);
  app.useAssetManager(new AssetManagerLibrary());

  await app.init(options);

  const ball = ecsLibrary.createEntity();

  ecsLibrary.addComponent(ball, new Velocity(2, 2));
  ecsLibrary.addComponent(ball, new Position(50, 50));
  ecsLibrary.addSystem(move);
  ecsLibrary.addSystem(logger);
  ecsLibrary.addSystem(() => framerate(30));

  app.run();
};
