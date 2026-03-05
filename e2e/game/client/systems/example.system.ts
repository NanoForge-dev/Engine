import { type Context } from "@nanoforge-dev/common";
import { type EditorSystemManifest, type Registry } from "@nanoforge-dev/ecs-client";

import { ExampleComponent } from "../components/example.component";

export const exampleSystem = (registry: Registry, ctx: Context) => {
  const entities = registry.getZipper([ExampleComponent]);

  entities.forEach((entity) => {
    if (entity.ExampleComponent.paramA === "end") {
      ctx.app.setIsRunning(false);
      return;
    }

    if (entity.ExampleComponent.paramB === 0) entity.ExampleComponent.paramA = "end";

    if (entity.ExampleComponent.paramB >= 0)
      entity.ExampleComponent.paramB = entity.ExampleComponent.paramB - 1;
  });
};

// * Required to generate code
export default exampleSystem.name;

// * Required for the editor to display the system and generate code
export const EDITOR_SYSTEM_MANIFEST: EditorSystemManifest = {
  name: "Example",
  description:
    "This system end the game when paramB reaches 0 for any entity with ExampleComponent",
  dependencies: ["ExampleComponent"],
};
