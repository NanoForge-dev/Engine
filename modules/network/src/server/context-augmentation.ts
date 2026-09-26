import type { NetworkServerContextApi } from "./network-server-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    network: NetworkServerContextApi;
  }
}
