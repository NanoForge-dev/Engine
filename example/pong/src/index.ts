import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import { type IRunOptions } from "@nanoforge/common";
import { NanoforgeFactory } from "@nanoforge/core";
import { ECSLibrary } from "@nanoforge/ecs";
import { Graphics2DLibrary } from "@nanoforge/graphics-2d";

import { Bounce, CircleComponent, Position, Velocity } from "./components";
import { bounce, draw, framerate, move } from "./systems";

export const ecsLibrary = new ECSLibrary();

export const app = NanoforgeFactory.createClient();
export const graphics = new Graphics2DLibrary();

export const main = async (options: IRunOptions) => {
  app.useGraphics(graphics);
  app.useComponentSystem(ecsLibrary);
  app.useAssetManager(new AssetManagerLibrary());

  await app.init(options);

  const ball = ecsLibrary.createEntity();

  ecsLibrary.addComponent(ball, new Velocity(0.05, 0.05));
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
  ecsLibrary.addSystem(move);
  ecsLibrary.addSystem(draw);
  ecsLibrary.addSystem(bounce);
  ecsLibrary.addSystem(() => framerate(30));

  app.run();
};
