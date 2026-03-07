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

export class ClientConfigNetwork {
  @Expose()
  @IsOptional()
  @IsPort()
  SERVER_TCP_PORT?: string;

  @Expose()
  @IsOptional()
  @IsPort()
  SERVER_UDP_PORT?: string;

  @Expose()
  @IsIpOrFQDN()
  SERVER_ADDRESS!: string;

  @Expose()
  @Default("PACKET_END")
  @IsByteLength(2, 64)
  MAGIC_VALUE!: string;

  @Expose()
  @TransformToBoolean()
  @IsBoolean()
  @Default(false)
  WSS!: boolean;
}
