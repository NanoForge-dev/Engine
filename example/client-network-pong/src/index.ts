import { ClientNetworkLibrary } from "@nanoforge-dev/client-network";
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { ECSLibrary } from "@nanoforge-dev/ecs";
import { Graphics, Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputEnum } from "@nanoforge-dev/input";

import { CircleComponent, Controller, Position, RectangleComponent, Velocity } from "./components";
import { controlPlayer, draw, move, packetHandler } from "./systems";

export const app = NanoforgeFactory.createClient({
  tickRate: 60,
  environment: { serverTcpPort: "4445", serverUdpPort: "4444", serverAddress: "127.0.0.1" },
});

export const layer = new Graphics.Layer();

export const main = async (options: IRunOptions) => {
  const graphics = new Graphics2DLibrary();
  const ecsLibrary = new ECSLibrary();
  const network = new ClientNetworkLibrary();

  app.useGraphics(graphics);
  app.useComponentSystem(ecsLibrary);
  app.useNetwork(network);

  await app.init(options);

  const registry = ecsLibrary.registry;

  graphics.stage.add(layer);

  const ball = registry.spawnEntity();
  registry.addComponent(ball, new Velocity(10, 0));
  registry.addComponent(ball, new Position(1920 / 2, 1080 / 2));
  registry.addComponent(
    ball,
    new CircleComponent(
      new Graphics.Circle({
        radius: 30,
        fill: "red",
      }),
    ),
  );

  const me = registry.spawnEntity();
  registry.addComponent(me, new Controller(InputEnum.ArrowUp, InputEnum.ArrowDown));

  const paddle1 = registry.spawnEntity();
  registry.addComponent(paddle1, new Position(20, 100));
  registry.addComponent(paddle1, new Velocity(0, 0));
  registry.addComponent(
    paddle1,
    new RectangleComponent(new Graphics.Rect({ fill: "blue", width: 30, height: 300 })),
  );

  const paddle2 = registry.spawnEntity();
  registry.addComponent(paddle2, new Position(1850, 100));
  registry.addComponent(paddle2, new Velocity(0, 0));
  registry.addComponent(
    paddle2,
    new RectangleComponent(new Graphics.Rect({ fill: "blue", width: 30, height: 300 })),
  );

  registry.addSystem(packetHandler);
  registry.addSystem(move);
  registry.addSystem(controlPlayer);
  registry.addSystem(draw);

  new RectangleComponent(
    new Graphics.Rect({
      strokeEnabled: true,
      stroke: "black",
      strokeWidth: 2,
      width: 1920,
      height: 1080,
    }),
  );

  async function waitForConnection(): Promise<void> {
    if (network.udp?.isConnected()) return;

    return new Promise((resolve) => {
      const check = () => {
        if (network.udp?.isConnected()) {
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
  app.run();
};
