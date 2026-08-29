import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { Circle, Graphics2DLibrary, Layer, Rect } from "@nanoforge-dev/graphics-2d";
import { InputEnum, InputLibrary } from "@nanoforge-dev/input";
import { NetworkClientLibrary } from "@nanoforge-dev/network/client";

import {
  CircleComponent,
  Controller,
  Position,
  RectangleComponent,
  Velocity,
} from "./components/components";
import { controlPlayer, draw, move, packetHandler } from "./systems/systems";

export const layer = new Layer();

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({ tickRate: 60 });
  const graphics = new Graphics2DLibrary();
  const ecs = new EcsLibrary();
  const network = new NetworkClientLibrary();
  const input = new InputLibrary();

  app.use(graphics);
  app.use(ecs);
  app.use(network);
  app.use(input);

  await app.init(options);

  const registry = ecs.registry;

  graphics.stage.add(layer);

  const terrain = registry.spawnEntity();
  registry.addComponent(terrain, new Position(0, 0));
  registry.addComponent(
    terrain,
    new RectangleComponent(new Rect({ fill: "rgb(58,99,39)", width: 1920, height: 1080 })),
  );
  const terrainLine = registry.spawnEntity();
  registry.addComponent(terrainLine, new Position(955, 0));
  registry.addComponent(
    terrainLine,
    new RectangleComponent(new Rect({ fill: "rgb(148,204,117)", width: 10, height: 1080 })),
  );

  const ball = registry.spawnEntity();
  registry.addComponent(ball, new Velocity(0, 0));
  registry.addComponent(ball, new Position(0, 0));
  registry.addComponent(
    ball,
    new CircleComponent(
      new Circle({
        radius: 30,
        fill: "red",
      }),
    ),
  );

  const me = registry.spawnEntity();
  registry.addComponent(me, new Controller(InputEnum.ArrowUp, InputEnum.ArrowDown));

  const paddle1 = registry.spawnEntity();
  registry.addComponent(paddle1, new Position(0, 0));
  registry.addComponent(paddle1, new Velocity(0, 0));
  registry.addComponent(
    paddle1,
    new RectangleComponent(new Rect({ fill: "blue", width: 30, height: 300 })),
  );

  const paddle2 = registry.spawnEntity();
  registry.addComponent(paddle2, new Position(0, 0));
  registry.addComponent(paddle2, new Velocity(0, 0));
  registry.addComponent(
    paddle2,
    new RectangleComponent(new Rect({ fill: "blue", width: 30, height: 300 })),
  );

  registry.addSystem(packetHandler);
  registry.addSystem(move);
  registry.addSystem(controlPlayer);
  registry.addSystem(draw);

  async function waitForConnection(): Promise<void> {
    if (network.tcp?.isConnected()) return;

    return new Promise((resolve) => {
      const check = () => {
        if (network.tcp?.isConnected()) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  await waitForConnection();
  network.tcp?.sendData(new TextEncoder().encode(JSON.stringify({ type: "play" })));

  await app.run();
};
