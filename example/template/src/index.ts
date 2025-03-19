import { AssetManagerLibrary } from "@nanoforge/asset-manager";
import { type IRunOptions } from "@nanoforge/common";
import { NanoforgeFactory } from "@nanoforge/core";
import { ECSLibrary } from "@nanoforge/ecs";
import { Graphics2DLibrary } from "@nanoforge/graphics-2d";

export const app = NanoforgeFactory.createClient();

export const main = async (options: IRunOptions) => {
  app.useGraphics(new Graphics2DLibrary());
  app.useAssetManager(new AssetManagerLibrary());
  app.useComponentSystem(new ECSLibrary());

  await app.init(options);
  app.run();
};
