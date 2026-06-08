import {
  Default,
  Expose,
  IsBoolean,
  IsByteLength,
  IsIpOrFQDN,
  IsOptional,
  IsPort,
  TransformToBoolean,
} from "@nanoforge-dev/config";

/**
 * Environment-variable configuration for `NetworkClientLibrary`.
 *
 * @remarks
 * Resolved automatically by `IConfigRegistry.registerConfig` during `__init`.
 * Set these variables in the environment (or pass them via
 * `IRunClientOptions.env`) before running the application.
 */
export class ClientConfigNetwork {
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
  @IsIpOrFQDN()
  SERVER_ADDRESS!: string;

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
