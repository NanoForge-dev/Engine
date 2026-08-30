import type { NetworkClientContextApi } from "./network-client-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    network: NetworkClientContextApi;
  }
}
