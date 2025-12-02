import { type IApplicationOptions } from "./application-options.type";
import { NanoforgeClient } from "./nanoforge-client";
import { NanoforgeServer } from "./nanoforge-server";

class NanoforgeFactoryStatic {
  createClient(options?: Partial<IApplicationOptions>): NanoforgeClient {
    return new NanoforgeClient(options);
  }

  createServer(options?: Partial<IApplicationOptions>): NanoforgeServer {
    return new NanoforgeServer(options);
  }
}

export const NanoforgeFactory = new NanoforgeFactoryStatic();
