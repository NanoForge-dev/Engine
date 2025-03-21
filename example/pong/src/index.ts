import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import { type IRunOptions } from "@nanoforge/common";
import { NanoforgeFactory } from "@nanoforge/core";
import { ECSLibrary } from "@nanoforge/ecs";
import { Graphics2DLibrary } from "@nanoforge/graphics-2d";
import { InputLibrary } from "@nanoforge/input";
import { InputEnum } from "@nanoforge/input";

import {
  Bounce,
  CircleComponent,
  Controller,
  Hitbox,
  Position,
  RectangleComponent,
  Velocity,
} from "./components";
import {
  bounce,
  controlPlayer,
  drawCircle,
  drawRectangle,
  framerate,
  move,
  moveRectangle,
} from "./systems";

export const ecsLibrary = new ECSLibrary();

export const app = NanoforgeFactory.createClient();
export const graphics = new Graphics2DLibrary();
export const inputs = new InputLibrary();

export const main = async (options: IRunOptions) => {
  app.useGraphics(graphics);
  app.useComponentSystem(ecsLibrary);
  app.useAssetManager(new AssetManagerLibrary());
  app.useInput(inputs);

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

  const topWall = ecsLibrary.createEntity();
  ecsLibrary.addComponent(
    topWall,
    new RectangleComponent(
      await graphics.factory.createRectangle({
        color: { r: 0, g: 0, b: 0, a: 1 },
      }),
    ),
  );
  ecsLibrary.addComponent(topWall, new Position(-1.8, 0.91));
  ecsLibrary.addComponent(topWall, new Hitbox(3.6, 0.1));

  const botWall = ecsLibrary.createEntity();
  ecsLibrary.addComponent(
    botWall,
    new RectangleComponent(
      await graphics.factory.createRectangle({
        color: { r: 0, g: 0, b: 0, a: 1 },
      }),
    ),
  );
  ecsLibrary.addComponent(botWall, new Position(-1.8, -1));
  ecsLibrary.addComponent(botWall, new Hitbox(3.6, 0.1));

  const player1 = ecsLibrary.createEntity();
  ecsLibrary.addComponent(player1, new Position(-1.8, -0.3));
  ecsLibrary.addComponent(player1, new Velocity(0, 0.1));
  ecsLibrary.addComponent(player1, new Hitbox(0.1, 0.5));
  ecsLibrary.addComponent(player1, new Controller(InputEnum.KeyW, InputEnum.KeyS));
  ecsLibrary.addComponent(
    player1,
    new RectangleComponent(
      await graphics.factory.createRectangle({
        color: { r: 0, g: 0, b: 1, a: 1 },
      }),
    ),
  );

  const player2 = ecsLibrary.createEntity();
  ecsLibrary.addComponent(player2, new Position(1.7, -0.3));
  ecsLibrary.addComponent(player2, new Velocity(0, 0.1));
  ecsLibrary.addComponent(player2, new Hitbox(0.1, 0.5));
  ecsLibrary.addComponent(player2, new Controller(InputEnum.ArrowUp, InputEnum.ArrowDown));
  ecsLibrary.addComponent(
    player2,
    new RectangleComponent(
      await graphics.factory.createRectangle({
        color: { r: 0, g: 0, b: 1, a: 1 },
      }),
    ),
  );

  ecsLibrary.addSystem(move);
  ecsLibrary.addSystem(controlPlayer);
  ecsLibrary.addSystem(moveRectangle);
  ecsLibrary.addSystem(drawRectangle);
  ecsLibrary.addSystem(drawCircle);
  ecsLibrary.addSystem(bounce);
  ecsLibrary.addSystem(() => framerate(30));

  app.run();
};
