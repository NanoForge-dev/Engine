import * as RedGPU from "redgpu";
import { type RedGPUContext } from "redgpu";
import { type Scene, type View2D } from "redgpu";

export class GraphicsCore {
  private _redGPUContext: RedGPUContext;
  private _scene: Scene;
  private _view: View2D;
  private _renderer: RedGPU.Renderer;

  public async init(canvas: HTMLCanvasElement): Promise<void> {
    await RedGPU.init(
      canvas,
      (_redGPUContext: RedGPU.RedGPUContext) => {
        this._redGPUContext = _redGPUContext;

        const _scene = new RedGPU.Display.Scene("main");
        const _view = new RedGPU.Display.View2D(_redGPUContext, _scene);
        _redGPUContext.addView(_view);

        this._scene = _scene;
        this._view = _view;
        this._renderer = new RedGPU.Renderer();
      },
      (failReason: string) => {
        throw new Error(failReason);
      },
    );
  }

  public async render(): Promise<void> {
    if (this._renderer && this._redGPUContext) {
      this._renderer.renderFrame(this._redGPUContext, 0);
    }
  }
}
