import {
  Default,
  Expose,
  IsBoolean,
  IsIpOrURL,
  IsOptional,
  IsPort,
  TransformToBoolean,
} from "@nanoforge-dev/env";

import { NetworkConfig } from "../shared/config.network";

/**
 * Environment-variable configuration for `NetworkClientLibrary`.
 *
 * @remarks
 * Resolved via `registerEnv(ClientConfigNetwork, ctx.env)` during `__init`.
 */
export class ClientConfigNetwork extends NetworkConfig {
  /**
   * Port of the server's TCP WebSocket endpoint.
   *
   * @remarks
   * Either this or `SERVER_UDP_PORT` (or both) must be set.
   */
  @Expose()
  @IsOptional()
  @IsPort()
  SERVER_TCP_PORT?: string;

  /**
   * Port of the server's UDP (WebRTC signaling) endpoint.
   *
   * @remarks
   * Either this or `SERVER_TCP_PORT` (or both) must be set.
   */
  @Expose()
  @IsOptional()
  @IsPort()
  SERVER_UDP_PORT?: string;

  /** Hostname or IP address of the game server. */
  @Expose()
  @IsIpOrURL(undefined, undefined, { protocols: ["ws", "wss", "http", "https"] })
  SERVER_ADDRESS!: string;

  /**
   * Use secure WebSocket (`wss://`) connections.
   *
   * @default false
   */
  @Expose()
  @TransformToBoolean()
  @IsBoolean()
  @Default(false)
  WSS!: boolean;
}
