import { type ValidationOptions, isFQDN, isIP, registerDecorator } from "class-validator";

/**
 * Property decorator that validates whether the value is a valid IPv4/IPv6
 * address or a fully qualified domain name (FQDN).
 *
 * @remarks
 * Built on top of `class-validator`'s `isIP` and `isFQDN` helpers.  Use on
 * config properties that represent server hostnames or addresses.
 *
 * @param validationOptions - Optional class-validator validation options.
 *
 * @example
 * ```ts
 * class MyConfig {
 *   \@Expose()
 *   \@IsIpOrFQDN()
 *   SERVER_ADDRESS!: string;
 * }
 * ```
 */
export const IsIpOrFQDN = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
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
};
