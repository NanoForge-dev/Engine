import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import { type IRunOptions } from "@nanoforge/common";
import { NanoforgeFactory } from "@nanoforge/core";
import { ECSLibrary } from "@nanoforge/ecs";
import { Graphics2DLibrary } from "@nanoforge/graphics-2d";

import { Bounce } from "./components/bounce";
import { Position } from "./components/position";
import { bouncing } from "./systems/bouncing";

export const app = NanoforgeFactory.createClient();

export const ecs = new ECSLibrary();
export const graph = new Graphics2DLibrary();

export const main = async (options: IRunOptions) => {
  //app.useGraphics(graph);
  app.useAssetManager(new AssetManagerLibrary());
  app.useComponentSystem(ecs);

  await app.init(options);

  const ball = ecs.createEntity();

  ecs.addComponent(ball, new Bounce());
  ecs.addComponent(ball, new Position(50, 50));
  ecs.addSystem(bouncing);

  app.run();
};
