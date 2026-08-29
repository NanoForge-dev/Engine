// Ambient stub for the `nf` CLI's own `nanoforge/config` resolution. Keep this
// shape in sync with @nanoforge-dev/config's real types; revisit/remove once
// the CLI's actual resolution contract for `nanoforge.config.ts` is confirmed.
declare module "nanoforge/config" {
  type ContainLibConfig = {
    libs?: string[];
  };

  type BuildableConfig = {
    entryFile?: string;
    out?: {
      dir?: string;
      mainFile?: string;
    };
  };

  type SourceableConfig = {
    dir?: {
      assets?: string;

      packages?: string;

      // Used by the editor only
      components?: string;

      // Used by the editor only
      systems?: string;

      // Used by the editor only
      scenes?: string;
    };
  };

  type BaseConfig<Type extends string> = {
    type: Type;
  };

  type WorkspaceConfig = BaseConfig<"workspace"> & {
    packages?: string[];
  };
  type LibConfig = BaseConfig<"lib"> & {
    dir?: {
      assets?: string;
      shared?: string;

      // Used by the editor only
      // Should be inside shared dir
      components?: string;

      // Used by the editor only
      // Should be inside shared dir
      systems?: string;

      // Used by the editor only
      // Should be inside shared dir
      scenes?: string;
    };
  };
  type ClientConfig = BaseConfig<"client"> & SourceableConfig & BuildableConfig & ContainLibConfig;
  type ServerConfig = BaseConfig<"server"> & SourceableConfig & BuildableConfig & ContainLibConfig;

  export type Config = WorkspaceConfig | LibConfig | ClientConfig | ServerConfig;

  export const defineConfig: (config: Config) => any;
}
