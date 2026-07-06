import { type ValidationOptions, isIP, isURL, registerDecorator } from "class-validator";

/**
 * Property decorator that validates whether the value is a valid IPv4/IPv6
 * address or a fully qualified domain name (URL).
 *
 * @remarks
 * Built on top of `class-validator`'s `isIP` and `isURL` helpers.  Use on
 * config properties that represent server hostnames or addresses.
 *
 * @param validationOptions - Optional class-validator validation options.
 * @param isIPOptions - Optional options for `isIP` validation.
 * @param isURLOptions - Optional options for `isURL` validation.
 *
 * @example
 * ```ts
 * class MyConfig {
 *   \@Expose()
 *   \@IsIpOrURL()
 *   SERVER_ADDRESS!: string;
 * }
 * ```
 */
export const IsIpOrURL = (
  validationOptions?: ValidationOptions,
  isIPOptions?: Parameters<typeof isIP>[1],
  isURLOptions?: Parameters<typeof isURL>[1],
) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      ...(validationOptions ? { options: validationOptions } : {}),
      constraints: [],
      validator: {
        validate(value: string) {
          return isIP(value, isIPOptions) || isURL(value, isURLOptions);
        },
        defaultMessage() {
          return `$value must be a valid IP address or URL`;
        },
      },
    });
  };
};
