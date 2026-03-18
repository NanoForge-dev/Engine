import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export class ConfigRegistry {
  private readonly _env: Record<string, unknown>;

  constructor(env: Record<string, unknown>) {
    this._env = env;
  }

  async registerConfig<T extends object>(config: new () => T): Promise<T | never> {
    const data = plainToInstance(config, this._env, { excludeExtraneousValues: true });
    const errors = await validate(data);
    if (errors.length > 0) {
      throw new Error(errors.toString());
    }
    return data;
  }
}
