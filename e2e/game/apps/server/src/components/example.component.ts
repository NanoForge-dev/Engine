/**
 * Counts down from `paramB`: the `exampleSystem` stops the game once it reaches 0.
 *
 * @component
 * @side server
 */
export class ExampleComponent {
  name = "ExampleComponent";

  constructor(
    /** Set to `end` by `exampleSystem` once `paramB` reaches 0. */
    public paramA: string,
    /** Ticks left before the game stops. */
    public paramB: number,
    /** Whether `paramAOrDefault` returns `paramA`. */
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
