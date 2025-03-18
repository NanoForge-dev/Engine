import { type GraphicsCore } from "../../../core";
import { type ICircleOptions, type IColor, type IVertex2D } from "../../../types";
import { NfShape } from "../common/shape";

export class NfCircle extends NfShape {
  private _pos: IVertex2D;
  private _radius: number;
  private _color: IColor;

  constructor(core: GraphicsCore, options?: Partial<ICircleOptions>) {
    super(core);

    this._pos = options?.pos ?? { x: 0, y: 0 };
    this._radius = options?.radius ?? 1;
    this._color = options?.color ?? { r: 0, g: 0, b: 0, a: 1 };
  }

  public setPosition(pos: IVertex2D): void {
    this._pos = pos;
  }

  public setRadius(radius: number): void {
    this._radius = radius;
  }

  public setColor(color: IColor): void {
    this._color = color;
  }
}
