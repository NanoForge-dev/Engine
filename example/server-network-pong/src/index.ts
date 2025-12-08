import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { ECSLibrary } from "@nanoforge-dev/ecs";
import { ServerNetworkLibrary } from "@nanoforge-dev/server-network";

import { Position, Velocity } from "./components";
import { bounce, move, packetHandler } from "./systems";

export const app = NanoforgeFactory.createServer({
  tickRate: 60,
  environment: { listeningTcpPort: "4445", listeningUdpPort: "4444" },
});

export const main = async (options: IRunOptions) => {
  const ecsLibrary = new ECSLibrary();
  const network = new ServerNetworkLibrary();
  const assetManager = new AssetManagerLibrary();

  app.useComponentSystem(ecsLibrary);
  app.useNetwork(network);
  app.useAssetManager(assetManager);

  await app.init(options);

  const registry = ecsLibrary.registry;

  const ball = registry.spawnEntity();
  registry.addComponent(ball, new Position(960, 540));
  registry.addComponent(ball, new Velocity(0, 0));

  const paddle1 = registry.spawnEntity();
  registry.addComponent(paddle1, new Position(20, 390));
  registry.addComponent(paddle1, new Velocity(0, 0));

  const paddle2 = registry.spawnEntity();
  registry.addComponent(paddle2, new Position(1850, 390));
  registry.addComponent(paddle2, new Velocity(0, 0));

  registry.addSystem(packetHandler);
  registry.addSystem(bounce);
  registry.addSystem(move);

  app.run();
};

main({
  files: new Map([
    ["/libecs.wasm", "/home/leoout/eip/engine/example/server-network-pong/dist/libecs.wasm"],
  ]),
});
