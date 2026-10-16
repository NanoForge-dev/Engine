import "./context-augmentation";

export type { NetworkConfig } from "../shared/config.network";
export { Channel, type ChannelOptions } from "../shared/channels";
export { NetworkData, type NetworkPayload } from "../shared/network-data";
export {
  type PacketArgs,
  type PacketDefinition,
  type PacketListener,
  type PacketOptions,
  definePacket,
} from "../shared/packet";
export type {
  ClientPacketInfo,
  ClientPacketsApi,
  NetworkClientContextApi,
} from "../client/network-client-context.type";
export type {
  ClientId,
  ClientInfo,
  ClientListener,
  ClientsApi,
  ConnectionInfo,
  Transport,
} from "../server/client-registry";
export type {
  NetworkServerContextApi,
  ServerPacketInfo,
  ServerPacketsApi,
} from "../server/network-server-context.type";
export { PeerConfigNetwork } from "./config.peer.network";
export type { NetworkPeerContextApi } from "./network-peer-context.type";
export { NetworkPeerLibrary } from "./peer.network.library";
