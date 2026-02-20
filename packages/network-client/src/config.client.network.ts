import {
  Default,
  Expose,
  IsBoolean,
  IsByteLength,
  IsIpOrFQDN,
  IsOptional,
  IsPort,
} from "@nanoforge-dev/config";

export class ClientConfigNetwork {
  @Expose()
  @IsOptional()
  @IsPort()
  serverTcpPort?: string;

  @Expose()
  @IsOptional()
  @IsPort()
  serverUdpPort?: string;

  @Expose()
  @IsIpOrFQDN()
  serverAddress!: string;

  @Expose()
  @Default("PACKET_END")
  @IsByteLength(2, 64)
  magicValue!: string;

  @Expose()
  @IsBoolean()
  @Default(false)
  wss!: boolean;
}
