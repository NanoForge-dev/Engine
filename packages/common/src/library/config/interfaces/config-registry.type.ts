export interface IConfigRegistry {
  registerConfig<T extends object>(config: new () => T): Promise<T | never>;
}
