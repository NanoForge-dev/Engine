import type { ClientRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/client";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { MusicLibrary } from "@nanoforge-dev/music";
import { NetworkClientLibrary } from "@nanoforge-dev/network/client";
import { SoundLibrary } from "@nanoforge-dev/sound";

import { ExampleComponent } from "./components/example.component";
import { exampleSystem } from "./systems/example.system";

export const main = async (options: ClientRunOptions): Promise<void> => {
  const app = NanoforgeFactory.createClient({ tickRate: 60 });

  const graphics = new Graphics2DLibrary();
  const ecs = new EcsLibrary();
  const input = new InputLibrary();
  const music = new MusicLibrary();
  const network = new NetworkClientLibrary();
  const sound = new SoundLibrary();

  app.use(graphics);
  app.use(ecs);
  app.use(input);
  app.use(music);
  app.use(network);
  app.use(sound);

  await app.init({
    ...options,
    env: {
      ...options.env,
      SERVER_ADDRESS: "127.0.0.1",
      SERVER_TCP_PORT: "4445",
      SERVER_UDP_PORT: "4444",
    },
  });

  const registry = ecs.registry;

  const exampleEntity = registry.spawnEntity();
  registry.addComponent(exampleEntity, new ExampleComponent("example", 10));

  registry.addSystem(exampleSystem);

  await app.run();
};
