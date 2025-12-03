import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager/src";
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { ECSLibrary } from "@nanoforge-dev/ecs";
import { Circle, Graphics2DLibrary, Layer, Rect } from "@nanoforge-dev/graphics-2d";
import { InputEnum } from "@nanoforge-dev/input";
import { InputLibrary } from "@nanoforge-dev/input/src";
import { SoundLibrary } from "@nanoforge-dev/sound";

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

export const app = NanoforgeFactory.createClient();

export const layer = new Layer();

export const main = async (options: IRunOptions) => {
  const assetManager = new AssetManagerLibrary();
  const graphics = new Graphics2DLibrary();
  const ecsLibrary = new ECSLibrary();
  const inputLibrary = new InputLibrary();
  const sounds = new SoundLibrary();

  app.useAssetManager(assetManager);
  app.useGraphics(graphics);
  app.useComponentSystem(ecsLibrary);
  app.useInput(inputLibrary);
  app.useSound(sounds);

  await app.init(options);

  const registry = ecsLibrary.registry;

  graphics.stage.add(layer);

  sounds.load("test", "https://universal-soundbank.com/sounds/18782.mp3");

  const ball = registry.spawnEntity();
  registry.addComponent(ball, new Velocity(10, 0));
  registry.addComponent(
    ball,
    new Position(graphics.stage.width() / 2, graphics.stage.height() / 2),
  );
  registry.addComponent(ball, new Bounce());
  registry.addComponent(
    ball,
    new CircleComponent(
      new Circle({
        radius: 70,
        fill: "red",
      }),
    ),
  );

  const player1 = registry.spawnEntity();
  registry.addComponent(player1, new Position(20, 100));
  registry.addComponent(player1, new Velocity(0, 5));
  registry.addComponent(player1, new Hitbox(50, 500));
  registry.addComponent(player1, new Controller(InputEnum.KeyW, InputEnum.KeyS));
  registry.addComponent(
    player1,
    new RectangleComponent(new Rect({ fill: "blue", width: 50, height: 500 })),
  );

  const player2 = registry.spawnEntity();
  registry.addComponent(player2, new Position(1850, 100));
  registry.addComponent(player2, new Velocity(0, 5));
  registry.addComponent(player2, new Hitbox(50, 500));
  registry.addComponent(player2, new Controller(InputEnum.ArrowUp, InputEnum.ArrowDown));
  registry.addComponent(
    player2,
    new RectangleComponent(new Rect({ fill: "blue", width: 50, height: 500 })),
  );

  registry.addSystem(move);
  registry.addSystem(controlPlayer);
  registry.addSystem(moveRectangle);
  registry.addSystem(drawCircle);
  registry.addSystem(bounce);

  app.run();
};
