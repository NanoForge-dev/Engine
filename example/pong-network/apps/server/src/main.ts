import type { RunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/server";
import { NetworkServerLibrary } from "@nanoforge-dev/network/server";

import { Input, Play } from "../../../shared/protocol";
import { Position, Velocity } from "./components/components";
import { bounce, handleClientInput, handlePlay, move, onClientDisconnect } from "./systems/systems";

export const main = async (options: RunOptions): Promise<void> => {
  const app = NanoforgeFactory.createServer({ tickRate: 60 });
  const ecs = new EcsLibrary();
  const network = new NetworkServerLibrary();

  app.use(ecs);
  app.use(network);

  await app.init(options);

  network.clients.onDisconnect(onClientDisconnect);

  const registry = ecs.registry;

  const ball = registry.spawnEntity();
  registry.addComponent(ball, new Position(960, 540));
  registry.addComponent(ball, new Velocity(0, 0));

  const paddle1 = registry.spawnEntity();
  registry.addComponent(paddle1, new Position(20, 390));
  registry.addComponent(paddle1, new Velocity(0, 0));

  const paddle2 = registry.spawnEntity();
  registry.addComponent(paddle2, new Position(1850, 390));
  registry.addComponent(paddle2, new Velocity(0, 0));

  const zip = () => registry.getZipper([Position, Velocity]);
  network.packets.on(Play, (_, { clientId, ctx }) => handlePlay(clientId, ctx.network, zip()));
  network.packets.on(Input, ({ key }, { clientId, ctx }) =>
    handleClientInput(clientId, key, ctx.network, zip()),
  );

  registry.addSystem(bounce);
  registry.addSystem(move);

  await app.run();
};
