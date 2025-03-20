import type { NfgCircle } from "@nanoforge/graphics-2d";

export class Velocity {
  name = "Velocity";
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class Position {
  name = "Position";
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class CircleComponent {
  name = "CircleComponent";
  component: NfgCircle;

  constructor(component: NfgCircle) {
    this.component = component;
  }
}

export class Bounce {
  name = "Bounce";
}
