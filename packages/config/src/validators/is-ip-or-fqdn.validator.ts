import { type ValidationOptions, isFQDN, isIP, registerDecorator } from "class-validator";

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
