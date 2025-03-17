export interface IRunOptions {
  canvas: HTMLCanvasElement;
  files: {
    assets: Map<string, string>;
    wasm: Map<string, string>;
    wgsl: Map<string, string>;
  };
}
