import { HttpStatus } from './http-status.enum';

export class HttpException extends Error {
  readonly statusCode: number;
  readonly errors?: any[];
  readonly responseMessage: string | Record<string, any>;

  constructor(
    message: string | Record<string, any>,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    errors?: any[]
  ) {
    super(typeof message === 'string' ? message : JSON.stringify(message));
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.responseMessage = message;
    Error.captureStackTrace(this, this.constructor);
  }

  getResponse() {
    if (typeof this.responseMessage === 'string') {
      return {
        statusCode: this.statusCode,
        message: this.responseMessage,
        errors: this.errors,
        timestamp: new Date().toISOString()
      };
    }
    return {
      statusCode: this.statusCode,
      ...this.responseMessage,
      timestamp: new Date().toISOString()
    };
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string | Record<string, any> = 'Bad Request', errors?: any[]) {
    super(message, HttpStatus.BAD_REQUEST, errors);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string | Record<string, any> = 'Unauthorized', errors?: any[]) {
    super(message, HttpStatus.UNAUTHORIZED, errors);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string | Record<string, any> = 'Forbidden', errors?: any[]) {
    super(message, HttpStatus.FORBIDDEN, errors);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string | Record<string, any> = 'Not Found', errors?: any[]) {
    super(message, HttpStatus.NOT_FOUND, errors);
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string | Record<string, any> = 'Internal Server Error', errors?: any[]) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, errors);
  }
} 