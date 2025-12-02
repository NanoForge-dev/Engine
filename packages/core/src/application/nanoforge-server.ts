import { NanoforgeApplication } from "./nanoforge-application";

export class NanoforgeServer extends NanoforgeApplication {
  protected get type(): "server" {
    return "server";
  }
}
