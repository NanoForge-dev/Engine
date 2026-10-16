import {
  Default,
  Expose,
  IsBoolean,
  IsIpOrURL,
  IsPort,
  TransformToBoolean,
} from "@nanoforge-dev/env";

import { NetworkConfig } from "../shared/config.network";

/**
 * Environment-variable configuration for `NetworkPeerLibrary`.
 *
 * @remarks
 * Resolved via `registerEnv(PeerConfigNetwork, ctx.env)` during `__init`.
 * Whether to host or join, and which room, are runtime choices, not
 * configuration: every player of a deployment gets the same environment.
 */
export class PeerConfigNetwork extends NetworkConfig {
  /** Hostname or IP address of the signaling server. */
  @Expose()
  @IsIpOrURL(undefined, undefined, { protocols: ["ws", "wss", "http", "https"] })
  SERVER_ADDRESS!: string;

  /** Port of the signaling server (its `LISTENING_SIGNALING_PORT`). */
  @Expose()
  @IsPort()
  SERVER_SIGNALING_PORT!: string;

  /**
   * Use secure WebSocket (`wss://`) for signaling.
   *
   * @default false
   */
  @Expose()
  @TransformToBoolean()
  @IsBoolean()
  @Default(false)
  WSS!: boolean;
}
