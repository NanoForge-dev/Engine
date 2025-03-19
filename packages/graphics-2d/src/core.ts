import { type InitContext } from "@nanoforge/common";

import { GraphicsRender } from "./render";
import { NfgWindow } from "./render/window";
import { ShaderManager } from "./shader/shader.manager";

export class GraphicsCore {
  private readonly _initContext: InitContext;

  private readonly _shaderManager: ShaderManager;
  private _render: GraphicsRender;
  private _window: NfgWindow;

  private _adapter: GPUAdapter;
  private _device: GPUDevice;

  constructor(context: InitContext) {
    this._initContext = context;

    this._shaderManager = new ShaderManager(this);
  }

  get initContext(): InitContext {
    return this._initContext;
  }

  get adapter(): GPUAdapter {
    return this._adapter;
  }

  get device(): GPUDevice {
    return this._device;
  }

  get shaderManager(): ShaderManager {
    return this._shaderManager;
  }

  get render(): GraphicsRender {
    return this._render;
  }

  get window(): NfgWindow {
    return this._window;
  }

  public async init(): Promise<void> {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("No appropriate GPUAdapter found.");
    }
    this._adapter = adapter;

    const device = await this._adapter.requestDevice();
    if (!device) {
      throw new Error("No appropriate GPUDevice found.");
    }
    this._device = device;

    this._render = new GraphicsRender(this, this._initContext);
    this._window = new NfgWindow(this._render);
  }
}
