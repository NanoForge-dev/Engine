import { type ValidationOptions, isIP, isURL, registerDecorator } from "class-validator";

/**
 * Property decorator that validates whether the value is a valid IPv4/IPv6
 * address or a fully qualified domain name (URL).
 *
 * @param validationOptions - Optional class-validator validation options.
 * @param isIPOptions - Optional options for `isIP` validation.
 * @param isURLOptions - Optional options for `isURL` validation.
 */
export const IsIpOrURL = (
  validationOptions?: ValidationOptions,
  isIPOptions?: Parameters<typeof isIP>[1],
  isURLOptions?: Parameters<typeof isURL>[1],
): PropertyDecorator => {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName as string,
      ...(validationOptions ? { options: validationOptions } : {}),
      constraints: [],
      validator: {
        validate: (value: string) => isIP(value, isIPOptions) || isURL(value, isURLOptions),
        defaultMessage: () => "$value must be a valid IP address or URL",
      },
    });
  };
};
