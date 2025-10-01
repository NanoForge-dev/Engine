import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import { type IRunOptions } from "@nanoforge/common";
import { NanoforgeFactory } from "@nanoforge/core";
import { ECSLibrary } from "@nanoforge/ecs";
import { Graphics, Graphics2DLibrary } from "@nanoforge/graphics-2d";
import { InputEnum, InputLibrary } from "@nanoforge/input";
import { SoundLibrary } from "@nanoforge/sound";

import {
  Bounce,
  CircleComponent,
  Controller,
  Hitbox,
  Position,
  RectangleComponent,
  Velocity,
} from "./components";
import { bounce, controlPlayer, drawCircle, move, moveRectangle } from "./systems";

export const ecsLibrary = new ECSLibrary();

export const app = NanoforgeFactory.createClient();
export const graphics = new Graphics2DLibrary();
export const inputs = new InputLibrary();
export const sounds = new SoundLibrary();
export const assetManager = new AssetManagerLibrary();

export const layer = new Graphics.Layer();

export const main = async (options: IRunOptions) => {
  app.useGraphics(graphics);
  app.useComponentSystem(ecsLibrary);
  app.useAssetManager(assetManager);
  app.useInput(inputs);
  app.useSound(sounds);

  await app.init(options);

  graphics.stage.add(layer);
  console.log(graphics.stage.width());

  sounds.load("test", "https://universal-soundbank.com/sounds/18782.mp3");

  const ball = ecsLibrary.spawnEntity();
  ecsLibrary.addComponent(ball, new Velocity(10, 0));
  ecsLibrary.addComponent(
    ball,
    new Position(graphics.stage.width() / 2, graphics.stage.height() / 2),
  );
  ecsLibrary.addComponent(ball, new Bounce());
  ecsLibrary.addComponent(
    ball,
    new CircleComponent(
      new Graphics.Circle({
        radius: 70,
        fill: "red",
      }),
    ),
  );

  const player1 = ecsLibrary.spawnEntity();
  ecsLibrary.addComponent(player1, new Position(20, 100));
  ecsLibrary.addComponent(player1, new Velocity(0, 5));
  ecsLibrary.addComponent(player1, new Hitbox(50, 500));
  ecsLibrary.addComponent(player1, new Controller(InputEnum.KeyW, InputEnum.KeyS));
  ecsLibrary.addComponent(
    player1,
    new RectangleComponent(new Graphics.Rect({ fill: "blue", width: 50, height: 500 })),
  );

  const player2 = ecsLibrary.spawnEntity();
  ecsLibrary.addComponent(player2, new Position(1850, 100));
  ecsLibrary.addComponent(player2, new Velocity(0, 5));
  ecsLibrary.addComponent(player2, new Hitbox(50, 500));
  ecsLibrary.addComponent(player2, new Controller(InputEnum.ArrowUp, InputEnum.ArrowDown));
  ecsLibrary.addComponent(
    player2,
    new RectangleComponent(new Graphics.Rect({ fill: "blue", width: 50, height: 500 })),
  );

  ecsLibrary.addSystem(move);
  ecsLibrary.addSystem(controlPlayer);
  ecsLibrary.addSystem(moveRectangle);
  ecsLibrary.addSystem(drawCircle);
  ecsLibrary.addSystem(bounce);

  app.run();
};
