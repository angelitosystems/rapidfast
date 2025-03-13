import 'reflect-metadata';

export interface SwaggerRouteMetadata {
  summary?: string;
  description?: string;
  parameters?: SwaggerParameter[];
  requestBody?: SwaggerRequestBody;
  responses?: Record<string, SwaggerResponse>;
}

export interface SwaggerParameter {
  in: 'path' | 'query' | 'header' | 'cookie';
  name: string;
  description?: string;
  required?: boolean;
  schema?: any;
}

export interface SwaggerRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, { schema: any }>;
}

export interface SwaggerResponse {
  description: string;
  content?: Record<string, { schema: any }>;
}

/**
 * Decorador para documentar una API con Swagger
 */
export function ApiDoc(metadata: any): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('swagger:api', metadata, target);
  };
}

/**
 * Decorador para documentar parámetros de ruta con Swagger
 */
export function ApiParam(metadata: any): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existingParams = Reflect.getMetadata('swagger:params', target, propertyKey) || [];
    existingParams.push(metadata);
    Reflect.defineMetadata('swagger:params', existingParams, target, propertyKey);
    return descriptor;
  };
}

/**
 * Decorador para documentar cuerpos de petición con Swagger
 */
export function ApiBody(metadata: any): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('swagger:body', metadata, target, propertyKey);
    return descriptor;
  };
}

/**
 * Decorador para documentar respuestas de API con Swagger
 */
export function ApiResponse(metadata: any): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const existingResponses = Reflect.getMetadata('swagger:responses', target, propertyKey) || [];
    existingResponses.push(metadata);
    Reflect.defineMetadata('swagger:responses', existingResponses, target, propertyKey);
    return descriptor;
  };
}

/**
 * Decorador para agrupar operaciones de API en tags
 */
export function ApiTags(...tags: string[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('swagger:tags', tags, target);
  };
}

/**
 * Decorador para marcar una propiedad como requerida
 */
export function ApiProperty(metadata: any = {}): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata('swagger:property', metadata, target, propertyKey);
  };
}