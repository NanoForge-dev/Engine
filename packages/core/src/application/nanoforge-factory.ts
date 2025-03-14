import { NanoforgeClient } from "./nanoforge-client";
import { NanoforgeServer } from "./nanoforge-server";

class NanoforgeFactoryStatic {
  createClient(): NanoforgeClient {
    return new NanoforgeClient();
  }

  createServer(): NanoforgeServer {
    return new NanoforgeServer();
  }
}

export const NanoforgeFactory = new NanoforgeFactoryStatic();
