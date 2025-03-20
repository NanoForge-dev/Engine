import { type NfgComponent } from "../components/component";
import { type GraphicsRender } from "../render";

export class NfgWindow {
  private _components: NfgComponent[] = [];
  private _render: GraphicsRender;
  private _uniformTimeout: boolean = false;
  private _uniformNeed: boolean = false;

  constructor(render: GraphicsRender) {
    this._render = render;

    window.addEventListener("resize", () => {
      this._updateWindowSize();
    });
    this._updateWindowSize();
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
    if (this._uniformNeed) {
      this.updateAllUniforms();
      this._uniformNeed = false;
    }
    this._render.render(this._components);
    this._components = [];
  }

  private _updateWindowSize(): void {
    this._render.canvas.width = window.innerWidth;
    this._render.canvas.height = window.innerHeight;
    // Uncomment if need performances
    // if (this._uniformTimeout) return;
    this._uniformTimeout = true;
    this._uniformNeed = true;
    setTimeout(() => {
      this._uniformTimeout = false;
    }, 100);
  }

  private updateAllUniforms(): void {
    this._components.forEach((component) => component.updateUniforms());
  }
}
