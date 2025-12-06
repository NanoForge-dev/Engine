import { AssetManagerLibrary } from "@nanoforge-dev/asset-manager";
import { type IRunOptions } from "@nanoforge-dev/common";
import { NanoforgeFactory } from "@nanoforge-dev/core";
import { ECSClientLibrary } from "@nanoforge-dev/ecs-client";
import { Graphics2DLibrary } from "@nanoforge-dev/graphics-2d";

export const app = NanoforgeFactory.createClient();

export const main = async (options: IRunOptions) => {
  app.useGraphics(new Graphics2DLibrary());
  app.useAssetManager(new AssetManagerLibrary());
  app.useComponentSystem(new ECSClientLibrary());

  await app.init(options);
  app.run();
};
