import {
  Default,
  Expose,
  IsByteLength,
  IsIpOrFQDN,
  IsOptional,
  IsPort,
  IsString,
} from "@nanoforge-dev/config";

/**
 * Environment-variable configuration for `NetworkServerLibrary`.
 *
 * @remarks
 * Resolved automatically by `IConfigRegistry.registerConfig` during `__init`.
 * Set these variables in the environment (or pass them via
 * `IRunServerOptions.env`) before running the application.
 */
export class ServerConfigNetwork {
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
  @IsIpOrFQDN()
  LISTENING_INTERFACE!: string;

  /**
   * Delimiter bytes appended to each packet for framing.
   *
   * @default "PACKET_END"
   */
  @Expose()
  @Default("PACKET_END")
  @IsByteLength(2, 64)
  MAGIC_VALUE!: string;

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
}
