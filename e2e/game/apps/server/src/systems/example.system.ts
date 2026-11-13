import { type Context } from "@nanoforge-dev/common";
import { type Registry } from "@nanoforge-dev/ecs/server";

import { ExampleComponent } from "../components/example.component";

/**
 * Counts `ExampleComponent.paramB` down every tick, then stops the game once it reached 0.
 *
 * @system
 * @side server
 */
export const exampleSystem = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([ExampleComponent]);

  entities.forEach((entity) => {
    if (entity.ExampleComponent.paramA === "end") {
      ctx.app.requestStop();
      return;
    }

    if (entity.ExampleComponent.paramB === 0) entity.ExampleComponent.paramA = "end";

    if (entity.ExampleComponent.paramB >= 0)
      entity.ExampleComponent.paramB = entity.ExampleComponent.paramB - 1;
  });
};
