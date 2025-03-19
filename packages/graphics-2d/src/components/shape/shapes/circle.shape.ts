import { type GraphicsCore } from "../../../core";
import { ShadersEnum } from "../../../shader/shaders.enum";
import { type ICircleOptions, type IColor, type IVertex2D } from "../../../types";
import { NfgShape } from "../common/shape";

export class NfgCircle extends NfgShape {
  protected _shader: GPUShaderModule;
  protected readonly _vertexBufferLayout: GPUVertexBufferLayout;
  protected _vertexLength: number;

  private _pos: IVertex2D;
  private _radius: number;
  private _color: IColor;

  constructor(core: GraphicsCore, options?: Partial<ICircleOptions>) {
    super(core);

    this._vertexBufferLayout = {
      arrayStride: 28,
      attributes: [
        {
          format: "float32x2",
          offset: 0,
          shaderLocation: 0,
        },
        {
          format: "float32",
          offset: 8,
          shaderLocation: 1,
        },
        {
          format: "float32x4",
          offset: 12,
          shaderLocation: 2,
        },
      ],
    };
    this._vertexLength = 7;

    this._pos = options?.pos ?? { x: 0, y: 0 };
    this._radius = options?.radius ?? 1;
    this._color = options?.color ?? { r: 0, g: 0, b: 0, a: 1 };
  }

  public setPosition(pos: IVertex2D): void {
    this._pos = pos;
    this._updateVertices();
  }

  public setRadius(radius: number): void {
    this._radius = radius;
    this._updateVertices();
  }

  public setColor(color: IColor): void {
    this._color = color;
    this._updateVertices();
  }

  protected async _init(): Promise<void> {
    this._shader = await this._shaderManager.get(ShadersEnum.CIRCLE);
  }

  protected _updateVertices(): void {
    this._setVertices([
      this._pos.x,
      this._pos.y,
      this._radius,
      this._color.r,
      this._color.g,
      this._color.b,
      this._color.a,
    ]);
  }
}
