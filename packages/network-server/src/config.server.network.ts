import {
  Default,
  Expose,
  IsArray,
  IsByteLength,
  IsIpOrFQDN,
  IsOptional,
  IsPort,
  IsString,
} from "@nanoforge-dev/config";

export class ServerConfigNetwork {
  @Expose()
  @IsOptional()
  @IsPort()
  LISTENING_TCP_PORT?: string;

  @Expose()
  @IsOptional()
  @IsPort()
  LISTENING_UDP_PORT?: string;

  @Expose()
  @Default("0.0.0.0")
  @IsIpOrFQDN()
  LISTENING_INTERFACE!: string;

  @Expose()
  @Default("PACKET_END")
  @IsByteLength(2, 64)
  MAGIC_VALUE!: string;

  @Expose()
  @IsString()
  @IsOptional()
  WSS_CERT?: string;

  @Expose()
  @IsString()
  @IsOptional()
  WSS_KEY?: string;

  @Expose()
  @Default([])
  @IsArray()
  ICE_SERVERS!: { urls: string; username: string; credential: string }[];
}
