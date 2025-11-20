import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { ECSLibrary } from "@nanoforge-dev/ecs";
import { Graphics, Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputEnum } from "@nanoforge-dev/input";
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

export const layer = new Graphics.Layer();

export const main = async (options: IRunOptions) => {
  const graphics = new Graphics2DLibrary();
  const ecsLibrary = new ECSLibrary();
  const sounds = new SoundLibrary();

  app.useGraphics(graphics);
  app.useComponentSystem(ecsLibrary);
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
      new Graphics.Circle({
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
    new RectangleComponent(new Graphics.Rect({ fill: "blue", width: 50, height: 500 })),
  );

  const player2 = registry.spawnEntity();
  registry.addComponent(player2, new Position(1850, 100));
  registry.addComponent(player2, new Velocity(0, 5));
  registry.addComponent(player2, new Hitbox(50, 500));
  registry.addComponent(player2, new Controller(InputEnum.ArrowUp, InputEnum.ArrowDown));
  registry.addComponent(
    player2,
    new RectangleComponent(new Graphics.Rect({ fill: "blue", width: 50, height: 500 })),
  );

  registry.addSystem(move);
  registry.addSystem(controlPlayer);
  registry.addSystem(moveRectangle);
  registry.addSystem(drawCircle);
  registry.addSystem(bounce);

  app.run();
};
