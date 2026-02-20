import {
  Default,
  Expose,
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
  listeningUdpPort?: string;

  @Expose()
  @IsOptional()
  @IsPort()
  listeningTcpPort?: string;

  @Expose()
  @Default("0.0.0.0")
  @IsIpOrFQDN()
  listeningInterface!: string;

  @Expose()
  @Default("PACKET_END")
  @IsByteLength(2, 64)
  magicValue!: string;

  @Expose()
  @IsString()
  @IsOptional()
  cert?: string;

  @Expose()
  @IsString()
  @IsOptional()
  key?: string;
}
