import { registerDecorator, ValidationOptions } from 'class-validator';

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function IsIndianMobile(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIndianMobile',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && INDIAN_MOBILE_REGEX.test(value);
        },
        defaultMessage() {
          return 'mobile must be a valid 10-digit Indian mobile number';
        },
      },
    });
  };
}
