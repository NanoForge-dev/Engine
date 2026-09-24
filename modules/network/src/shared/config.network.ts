import { Default, Expose, IsArray, IsByteLength, Transform } from "@nanoforge-dev/env";

import { DEFAULT_NANOFORGE_ICE_SERVERS } from "../default";

const ICE_URL = /^(stun|stuns|turn|turns):/i;

const transformIceServers = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null || value === "") return [];
  if (typeof value !== "string") return value;

  const trimmed = value.trim();

  if (trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  const urls = trimmed
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url !== "");

  if (!urls.every((url) => ICE_URL.test(url))) return value;

  return urls.map((url) => ({ urls: url }));
};

/**
 * Environment-variable configuration shared by the client and server network
 * libraries.
 *
 * @remarks
 * Settings both sides need, either to agree with each other (packet framing)
 * or to build their own peer connection (ICE servers), are inherited by
 * `ClientConfigNetwork` and `ServerConfigNetwork`.
 */
export class NetworkConfig {
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
   * STUN and TURN servers used while gathering ICE candidates.
   *
   * @remarks
   * Used by both the client and the server peer connection. A STUN entry lets
   * a peer behind a NAT discover its own public address, and a TURN entry
   * relays traffic when no direct path exists — typically a client on a
   * network that blocks UDP.
   *
   * Accepts a comma-separated list of `stun:`/`turn:` URLs, or a JSON array of
   * `RTCIceServer` objects. Use the JSON form for TURN: credentials must be
   * given as separate `username`/`credential` fields, since they cannot be
   * embedded in the URL. Invalid values are rejected at startup rather than
   * failing on the first client connection.
   *
   * @default []
   *
   * @example
   * ```sh
   * ICE_SERVERS=stun:stun.example.com:3478,stun:stun2.example.com:3478
   * ICE_SERVERS='[{"urls":"turn:turn.example.com:3478","username":"u","credential":"p"}]'
   * ```
   */
  @Expose()
  @Transform(transformIceServers)
  @Default(DEFAULT_NANOFORGE_ICE_SERVERS)
  @IsArray()
  ICE_SERVERS!: RTCIceServer[];
}
