import type { NfgCircle } from "@nanoforge/graphics-2d";
import type { NfgRectangle } from "@nanoforge/graphics-2d/src/components/shape/shapes/rectangle.shape";
import type { InputEnum } from "@nanoforge/input";

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

export class Hitbox {
  name = "Hitbox";
  height: number;
  width: number;

  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
  }
}

export class CircleComponent {
  name = "CircleComponent";
  component: NfgCircle;

  constructor(component: NfgCircle) {
    this.component = component;
  }
}

export class RectangleComponent {
  name = "RectangleComponent";
  component: NfgRectangle;

  constructor(component: NfgRectangle) {
    this.component = component;
  }
}

export class Bounce {
  name = "Bounce";
}

export class Controller {
  name = "Controller";
  up: InputEnum;
  down: InputEnum;

  constructor(up: InputEnum, down: InputEnum) {
    this.up = up;
    this.down = down;
  }
}
