import { type RunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { EcsLibrary } from "@nanoforge-dev/ecs/server";

import { ExampleComponent } from "./components/example.component";
import { exampleSystem } from "./systems/example.system";
import { TickerLibrary } from "./ticker.library";

export const main = async (options: RunOptions): Promise<void> => {
  const app = NanoforgeFactory.createServer({ tickRate: 60 });

  const ecs = new EcsLibrary();
  const ticker = new TickerLibrary(5);

  app.use(ecs);
  app.use(ticker);

  await app.init(options);

  const registry = ecs.registry;

  const exampleEntity = registry.spawnEntity();
  registry.addComponent(exampleEntity, new ExampleComponent("example", 10));

  registry.addSystem(exampleSystem);

  await app.run();

  await ticker.done;
};
