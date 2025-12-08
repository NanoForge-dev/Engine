import {
  Default,
  Expose,
  IsByteLength,
  IsOptional,
  IsPort,
  type ValidationOptions,
  isFQDN,
  isIP,
  registerDecorator,
} from "@nanoforge-dev/config";

export function IsIpOrFQDN(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      ...(validationOptions ? { options: validationOptions } : {}),
      constraints: [],
      validator: {
        validate(value: string) {
          return isIP(value) || isFQDN(value);
        },
        defaultMessage() {
          return `$value must be a valid IP address or FQDN`;
        },
      },
    });
  };
}

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
}
