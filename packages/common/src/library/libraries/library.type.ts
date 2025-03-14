import { type ApplicationContext, type ClearContext } from "../../context";

export interface ILibrary {
  get name(): string;

  init(context: ApplicationContext): Promise<void>;

  clear(context: ClearContext): Promise<void>;
}
