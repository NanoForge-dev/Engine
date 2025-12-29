import type { Circle, Rect } from "@nanoforge-dev/graphics-2d";
import type { InputEnum } from "@nanoforge-dev/input";

import { layer } from "./main";

export class NetworkId {
  name = "NetworkId";
  constructor(public id: number) {}
}

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
  component: Circle;

  constructor(component: Circle) {
    this.component = component;
    layer.add(this.component);
  }
}

export class RectangleComponent {
  name = "RectangleComponent";
  component: Rect;

  constructor(component: Rect) {
    this.component = component;
    layer.add(this.component);
  }
}

export class Controller {
  name = "Controller";
  up: InputEnum;
  down: InputEnum;
  lastPressedUp: boolean;
  lastPressedDown: boolean;

  constructor(up: InputEnum, down: InputEnum) {
    this.up = up;
    this.down = down;
    this.lastPressedUp = false;
    this.lastPressedDown = false;
  }
}
