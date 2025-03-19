import { type NfgComponent } from "../components/component";
import { type GraphicsRender } from "../render";

export class NfgWindow {
  private _components: NfgComponent[] = [];
  private _render: GraphicsRender;

  constructor(render: GraphicsRender) {
    this._render = render;
  }

  get width(): number {
    return this._render.canvas.width;
  }

  get height(): number {
    return this._render.canvas.height;
  }

  public draw(component: NfgComponent) {
    this._components.push(component);
  }

  public render(): void {
    this._render.render(this._components);
    this._components = [];
  }
}
