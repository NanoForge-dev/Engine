import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";
import { InputLibrary } from "@nanoforge-dev/input";
import { MusicLibrary } from "@nanoforge-dev/music";
import { NetworkClientLibrary } from "@nanoforge-dev/network-client";
import { SoundLibrary } from "@nanoforge-dev/sound";

import { ExampleComponent } from "./components/example.component";
import { exampleSystem } from "./systems/example.system";

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createClient({
    tickRate: 60,
  });

  const assetManager = new AssetManagerLibrary();
  const ecs = new ECSClientLibrary();
  const graphics = new Graphics2DLibrary();
  const input = new InputLibrary();
  const music = new MusicLibrary();
  const network = new NetworkClientLibrary();
  const sound = new SoundLibrary();

  app.useAssetManager(assetManager);
  app.useComponentSystem(ecs);
  app.useGraphics(graphics);
  app.useInput(input);
  app.useSound(sound);
  app.useNetwork(network);
  app.use(Symbol("music"), music);

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
}
