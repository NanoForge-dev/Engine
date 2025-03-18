import { type InitContext } from "@nanoforge/common";

import { type GraphicsCore } from "./core";

export class GraphicsRender {
  private readonly _core: GraphicsCore;
  private readonly _canvas: HTMLCanvasElement;
  private readonly _canvasContext: GPUCanvasContext;
  private readonly _canvasFormat: GPUTextureFormat;

  constructor(core: GraphicsCore, initContext: InitContext) {
    this._core = core;

    this._canvas = initContext.canvas;

    const context = initContext.canvas.getContext("webgpu");
    if (!context) {
      throw new Error("Could not get canvas context.");
    }
    this._canvasContext = context;

    this._canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    this._canvasContext.configure({
      device: this._core.device,
      format: this._canvasFormat,
    });
  }

  get canvasContext(): GPUCanvasContext {
    return this._canvasContext;
  }

  get canvasFormat(): GPUTextureFormat {
    return this._canvasFormat;
  }
}
