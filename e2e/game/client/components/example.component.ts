import { type EditorComponentManifest } from "@nanoforge-dev/ecs-client";

export class ExampleComponent {
  name = this.constructor.name;

  constructor(
    public paramA: string,
    public paramB: number,
    public paramC: boolean = false,
  ) {}

  get foo() {
    return "bar";
  }

  get paramAOrDefault() {
    return this.paramC ? this.paramA : "default";
  }

  addOne() {
    this.paramB += 1;
  }
}

// * Required to generate code
export default ExampleComponent.name;

// * Required for the editor to display the component and generate code
export const EDITOR_COMPONENT_MANIFEST: EditorComponentManifest = {
  name: "Example",
  description: "Example component description",
  params: {
    paramA: {
      type: "string",
      name: "Param A",
      description: "Param A description",
      example: "Example value",
    },
    paramB: {
      type: "number",
      name: "Param B",
      description: "Param B description",
      example: 3,
    },
    paramC: {
      type: "boolean",
      name: "Param C",
      description: "Param C description",
      example: true,
      default: false,
      // Not required because it has a default value
      optional: true,
    },
  },
};
