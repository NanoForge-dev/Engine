import { type InitContext } from "@nanoforge/common";

import { type NfgComponent } from "./components/component";
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

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  get canvasFormat(): GPUTextureFormat {
    return this._canvasFormat;
  }

  render(components: NfgComponent[]): void {
    const [encoder, pass] = this._beginRender();
    this._renderComponents(pass, components);
    this._endRender(encoder);
  }

  private _beginRender(): [GPUCommandEncoder, GPURenderPassEncoder] {
    const encoder = this._core.device.createCommandEncoder();

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this._canvasContext.getCurrentTexture().createView(),
          loadOp: "clear",
          clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
          storeOp: "store",
        },
      ],
    });

    return [encoder, pass];
  }

  private _renderComponents(pass: GPURenderPassEncoder, components: NfgComponent[]): void {
    for (const component of components) {
      component.draw(pass);
    }
  }

  private _endRender(encoder: GPUCommandEncoder): void {
    this._core.device.queue.submit([encoder.finish()]);
  }
}
