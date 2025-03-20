import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import { type IRunOptions } from "@nanoforge/common";
import { NanoforgeFactory } from "@nanoforge/core";
import { ECSLibrary } from "@nanoforge/ecs";
import { Graphics2DLibrary } from "@nanoforge/graphics-2d";

import { Bounce, CircleComponent, Position, RectangleComponent, Velocity } from "./components";
import { bounce, drawCircle, drawRectangle, framerate, move } from "./systems";

export const ecsLibrary = new ECSLibrary();

export const app = NanoforgeFactory.createClient();
export const graphics = new Graphics2DLibrary();

export const main = async (options: IRunOptions) => {
  app.useGraphics(graphics);
  app.useComponentSystem(ecsLibrary);
  app.useAssetManager(new AssetManagerLibrary());

  await app.init(options);

  const ball = ecsLibrary.createEntity();
  ecsLibrary.addComponent(ball, new Velocity(0.04, 0));
  ecsLibrary.addComponent(ball, new Position(0.5, 0));
  ecsLibrary.addComponent(ball, new Bounce());
  ecsLibrary.addComponent(
    ball,
    new CircleComponent(
      await graphics.factory.createCircle({
        radius: 0.1,
        color: { r: 1, g: 0, b: 0, a: 1 },
      }),
    ),
  );

  const bg = ecsLibrary.createEntity();
  ecsLibrary.addComponent(
    bg,
    new RectangleComponent(
      await graphics.factory.createRectangle({
        min: { x: -2, y: -1 },
        max: { x: 2, y: 1 },
        color: { r: 0, g: 0, b: 0, a: 0 },
      }),
    ),
  );

  const player1 = ecsLibrary.createEntity();
  ecsLibrary.addComponent(
    player1,
    new RectangleComponent(
      await graphics.factory.createRectangle({
        min: { x: -1.8, y: -0.3 },
        max: { x: -1.7, y: 0.3 },
        color: { r: 0, g: 0, b: 1, a: 1 },
      }),
    ),
  );

  const player2 = ecsLibrary.createEntity();
  ecsLibrary.addComponent(
    player2,
    new RectangleComponent(
      await graphics.factory.createRectangle({
        min: { x: 1.7, y: -0.3 },
        max: { x: 1.8, y: 0.3 },
        color: { r: 0, g: 0, b: 1, a: 1 },
      }),
    ),
  );

  ecsLibrary.addSystem(move);
  ecsLibrary.addSystem(drawRectangle);
  ecsLibrary.addSystem(drawCircle);
  ecsLibrary.addSystem(bounce);
  ecsLibrary.addSystem(() => framerate(30));

  app.run();
};
