import { Request, Response, NextFunction } from '../interfaces/http.interface';

export interface ValidationSchema {
  [key: string]: any;
}

export interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
}

interface JoiError extends Error {
  isJoi: boolean;
  details: Array<{ message: string }>;
}

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export function validate(schema: ValidationSchema, options: ValidationOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationOptions = {
        abortEarly: false,
        stripUnknown: true,
        ...options,
      };

      if (schema.body) {
        req.body = await schema.body.validateAsync(req.body, validationOptions);
      }

      if (schema.query) {
        req.query = await schema.query.validateAsync(req.query, validationOptions);
      }

      if (schema.params) {
        req.params = await schema.params.validateAsync(req.params, validationOptions);
      }

      next();
    } catch (error: unknown) {
      if (error instanceof Error && 'isJoi' in error && (error as JoiError).isJoi) {
        next(new ValidationError((error as JoiError).details.map(detail => detail.message)));
      } else {
        next(error);
      }
    }
  };
}

interface ValidationResult<T> {
  value: T;
  error?: ValidationError;
}

export function validateSync<T>(data: T, schema: any): ValidationResult<T> {
  try {
    const value = schema.validateSync(data, { abortEarly: false });
    return { value };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return {
        value: data,
        error: new ValidationError([error.message]),
      };
    }
    return {
      value: data,
      error: new ValidationError(['Unknown validation error']),
    };
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // Al menos 8 caracteres, una mayúscula, una minúscula y un número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
}

export function sanitize(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  }

  if (typeof data === 'string') {
    return data.trim();
  }

  return data;
} 