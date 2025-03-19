import { validate as classValidate, ValidatorOptions, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class Validator {
  static async validate<T extends object>(
    type: new () => T,
    data: object,
    options: ValidatorOptions = {}
  ): Promise<ValidationError[]> {
    const entity = plainToClass(type, data);
    return classValidate(entity, {
      whitelist: true,
      forbidNonWhitelisted: true,
      ...options,
    });
  }

  static async validateOrReject<T extends object>(
    type: new () => T,
    data: object,
    options: ValidatorOptions = {}
  ): Promise<T> {
    const errors = await this.validate(type, data, options);
    if (errors.length > 0) {
      throw new ValidationError();
    }
    return plainToClass(type, data);
  }

  static isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  static isUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  static isStrongPassword(value: string): boolean {
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const isLongEnough = value.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
  }

  static isPhoneNumber(value: string): boolean {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(value);
  }

  static isNumeric(value: string): boolean {
    return !isNaN(parseFloat(value)) && isFinite(Number(value));
  }

  static isAlpha(value: string): boolean {
    return /^[a-zA-Z]+$/.test(value);
  }

  static isAlphanumeric(value: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(value);
  }

  static isDate(value: string): boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static isBoolean(value: any): boolean {
    return typeof value === 'boolean' || value === 'true' || value === 'false';
  }

  static isArray(value: any): boolean {
    return Array.isArray(value);
  }

  static isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
} 