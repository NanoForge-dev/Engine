import { Default, Expose, IsIP, IsIpOrURL, IsOptional, IsPort, IsString } from "@nanoforge-dev/env";

import { NetworkConfig } from "../shared/config.network";

/**
 * Environment-variable configuration for `NetworkServerLibrary`.
 *
 * @remarks
 * Resolved via `registerEnv(ServerConfigNetwork, ctx.env)` during `__init`.
 */
export class ServerConfigNetwork extends NetworkConfig {
  /**
   * Port on which the TCP WebSocket server listens.
   *
   * @remarks
   * Either this or `LISTENING_UDP_PORT` (or both) must be set.
   */
  @Expose()
  @IsOptional()
  @IsPort()
  LISTENING_TCP_PORT?: string;

  /**
   * Port on which the UDP (WebRTC signaling) WebSocket server listens.
   *
   * @remarks
   * Either this or `LISTENING_TCP_PORT` (or both) must be set.
   */
  @Expose()
  @IsOptional()
  @IsPort()
  LISTENING_UDP_PORT?: string;

  /**
   * Network interface address the server binds to.
   *
   * @default "0.0.0.0"
   */
  @Expose()
  @Default("0.0.0.0")
  @IsIpOrURL()
  LISTENING_INTERFACE!: string;

  /**
   * Path to the TLS certificate file for WSS support.
   *
   * @remarks
   * Must be set together with `WSS_KEY`.
   */
  @Expose()
  @IsString()
  @IsOptional()
  WSS_CERT?: string;

  /**
   * Path to the TLS private key file for WSS support.
   *
   * @remarks
   * Must be set together with `WSS_CERT`.
   */
  @Expose()
  @IsString()
  @IsOptional()
  WSS_KEY?: string;

  /**
   * Fixed UDP port for the WebRTC transport.
   *
   * @remarks
   * Without it every peer gets a random port, which cannot be expressed as a
   * firewall rule, a port forward or a Kubernetes `containerPort`. Setting it
   * enables ICE UDP multiplexing, so every client shares this one port.
   */
  @Expose()
  @IsOptional()
  @IsPort()
  ICE_PORT?: string;

  /**
   * Public address to advertise in host ICE candidates.
   *
   * @remarks
   * Set this when the address the server sees on its own interfaces is not
   * the one clients must send to — a Kubernetes pod IP, a container bridge
   * address, or a LAN address behind a port forward. Only `typ host`
   * candidates are rewritten; addresses discovered through STUN are already
   * public and are left untouched.
   */
  @Expose()
  @IsOptional()
  @IsIP()
  ADVERTISE_IP?: string;
}
