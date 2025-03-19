import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Transform } from 'class-transformer';

// Decorador para validar email
export function IsEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return typeof value === 'string' && emailRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser un email válido`;
        }
      }
    });
  };
}

// Decorador para validar longitud mínima
export function MinLength(min: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'minLength',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [min],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string' && value.length >= args.constraints[0];
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener al menos ${args.constraints[0]} caracteres`;
        }
      }
    });
  };
}

// Decorador para validar string
export function IsString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return typeof value === 'string';
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser una cadena de texto`;
        }
      }
    });
  };
}

// Decorador para campos opcionales
export function IsOptional(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isOptional',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value === undefined || value === null;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} es opcional`;
        }
      }
    });
  };
}

// Re-exportar Transform de class-transformer
export { Transform }; 