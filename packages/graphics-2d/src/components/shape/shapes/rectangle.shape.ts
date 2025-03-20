import { type GraphicsCore } from "../../../core";
import { ShadersEnum } from "../../../shader/shaders.enum";
import { type IColor, type IRectangleOptions, type IVertex2D } from "../../../types";
import { NfgShape } from "../common/shape";

export class NfgRectangle extends NfgShape {
  protected _shader: GPUShaderModule;
  protected readonly _vertexBufferLayout: GPUVertexBufferLayout;
  protected _vertexLength: number;

  private _min: IVertex2D;
  private _max: IVertex2D;
  private _color: IColor;

  constructor(core: GraphicsCore, options?: Partial<IRectangleOptions>) {
    super(core);

    this._vertexBufferLayout = {
      arrayStride: 32,
      attributes: [
        {
          format: "float32x2",
          offset: 0,
          shaderLocation: 0,
        },
        {
          format: "float32x2",
          offset: 8,
          shaderLocation: 1,
        },
        {
          format: "float32x4",
          offset: 16,
          shaderLocation: 2,
        },
      ],
    };
    this._vertexLength = 8;

    this._duplicate = 1;

    this._min = options?.min ?? { x: 0, y: 0 };
    this._max = options?.max ?? { x: 0, y: 0 };
    this._color = options?.color ?? { r: 0, g: 0, b: 0, a: 1 };
    this._updateVertices();
  }

  public setMin(pos: IVertex2D): NfgRectangle {
    this._min = pos;
    this._updateVertices();
    return this;
  }

  public setMax(pos: IVertex2D): NfgRectangle {
    this._max = pos;
    this._updateVertices();
    return this;
  }

  public setColor(color: IColor): NfgRectangle {
    this._color = color;
    this._updateVertices();
    return this;
  }

  protected async _init(): Promise<void> {
    this._shader = await this._shaderManager.get(ShadersEnum.RECTANGLE);
  }

  protected _updateVertices(): void {
    this._setVertices([
      this._min.x,
      this._min.y,
      this._max.x,
      this._max.y,
      this._color.r,
      this._color.g,
      this._color.b,
      this._color.a,
      this._min.x,
      this._min.y,
      this._max.x,
      this._max.y,
      this._color.r,
      this._color.g,
      this._color.b,
      this._color.a,
      this._min.x,
      this._min.y,
      this._max.x,
      this._max.y,
      this._color.r,
      this._color.g,
      this._color.b,
      this._color.a,
      this._min.x,
      this._min.y,
      this._max.x,
      this._max.y,
      this._color.r,
      this._color.g,
      this._color.b,
      this._color.a,
      this._min.x,
      this._min.y,
      this._max.x,
      this._max.y,
      this._color.r,
      this._color.g,
      this._color.b,
      this._color.a,
      this._min.x,
      this._min.y,
      this._max.x,
      this._max.y,
      this._color.r,
      this._color.g,
      this._color.b,
      this._color.a,
    ]);
  }
}
