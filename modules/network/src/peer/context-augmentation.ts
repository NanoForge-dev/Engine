import type { NetworkPeerContextApi } from "./network-peer-context.type";

declare module "@nanoforge-dev/common" {
  interface Context {
    network: NetworkPeerContextApi;
  }
}
