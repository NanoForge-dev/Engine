export type IRunOptions = IRunClientOptions | IRunServerOptions;

export interface IRunClientOptions {
  canvas: HTMLCanvasElement;
  files: Map<string, string>;
}

export interface IRunServerOptions {
  files: Map<string, string>;
}
