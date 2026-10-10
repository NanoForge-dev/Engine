import "./context-augmentation";

export type { NetworkConfig } from "../shared/config.network";
export { Channel, type ChannelOptions, type ConnectOptions } from "../shared/channels";
export { NetworkData, type NetworkPayload } from "../shared/network-data";
export {
  type PacketArgs,
  type PacketDefinition,
  type PacketListener,
  type PacketOptions,
  definePacket,
} from "../shared/packet";
export { NetworkClientLibrary } from "./client.network.library";
export { ClientConfigNetwork } from "./config.client.network";
export type {
  ClientPacketInfo,
  ClientPacketsApi,
  NetworkClientContextApi,
} from "./network-client-context.type";
