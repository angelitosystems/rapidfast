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
 * Decorador para añadir etiquetas (tags) a un controlador o método
 * @param tags Etiquetas para agrupar endpoints en Swagger UI
 */
export function ApiTags(...tags: string[]): ClassDecorator & MethodDecorator {
  return (target: any, key?: string | symbol) => {
    const tagsKey = 'swagger:tags';
    // Si se aplica a un método
    if (key) {
      // Obtener tags existentes o inicializar array vacío
      const existingTags = Reflect.getMetadata(tagsKey, target, key as string) || [];
      // Añadir nuevos tags
      Reflect.defineMetadata(tagsKey, [...existingTags, ...tags], target, key as string);
    } 
    // Si se aplica a una clase (controlador)
    else {
      // Obtener tags existentes o inicializar array vacío
      const existingTags = Reflect.getMetadata(tagsKey, target) || [];
      // Añadir nuevos tags
      Reflect.defineMetadata(tagsKey, [...existingTags, ...tags], target);
    }
  };
}

/**
 * Decorador para añadir descripción a un controlador o método
 * @param description Descripción del controlador o método
 */
export function ApiDescription(description: string): ClassDecorator & MethodDecorator {
  return (target: any, key?: string | symbol) => {
    const descKey = 'swagger:description';
    // Si se aplica a un método
    if (key) {
      Reflect.defineMetadata(descKey, description, target, key as string);
    } 
    // Si se aplica a una clase (controlador)
    else {
      Reflect.defineMetadata(descKey, description, target);
    }
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