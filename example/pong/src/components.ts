import type { Graphics } from "@nanoforge/graphics-2d";
import type { InputEnum } from "@nanoforge/input";

import { layer } from "./index";

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
  component: Graphics.Circle;

  constructor(component: Graphics.Circle) {
    this.component = component;
    layer.add(this.component);
  }
}

export class RectangleComponent {
  name = "RectangleComponent";
  component: Graphics.Rect;

  constructor(component: Graphics.Rect) {
    this.component = component;
    layer.add(this.component);
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
