import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { ECSServerLibrary } from "@nanoforge-dev/ecs-server";

import { ExampleComponent } from "./components/example.component";
import { exampleSystem } from "./systems/example.system";
import { TickerLibrary } from "./ticker.library";

const TICKER = Symbol.for("ticker");

export async function main(options: IRunOptions) {
  const app = NanoforgeFactory.createServer({ tickRate: 60 });

  const assetManager = new AssetManagerLibrary();
  const ecs = new ECSServerLibrary();

  const ticker = new TickerLibrary(5);

  app.useAssetManager(assetManager);
  app.useComponentSystem(ecs);
  app.use(TICKER, ticker);

  await app.init(options);

  const registry = ecs.registry;

  const exampleEntity = registry.spawnEntity();
  registry.addComponent(exampleEntity, new ExampleComponent("example", 10));

  registry.addSystem(exampleSystem);

  await app.run();

  await ticker.done;
}
