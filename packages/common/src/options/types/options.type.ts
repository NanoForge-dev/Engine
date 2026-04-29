export type IRunOptions = IRunClientOptions | IRunServerOptions;

export interface IRunClientOptions {
  container: HTMLDivElement;
  files: Map<string, string>;
  env: Record<string, string | undefined>;
}

export interface IRunServerOptions {
  files: Map<string, string>;
  env: Record<string, string | undefined>;
}
