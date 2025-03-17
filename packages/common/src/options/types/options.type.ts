export interface IRunOptions {
  canvas: HTMLCanvasElement;
  files: {
    assets: Map<string, string>;
    scripts: Map<string, string>;
  };
}
