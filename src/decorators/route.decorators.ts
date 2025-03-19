import 'reflect-metadata';
import { RouteDefinition, RouteSwaggerOptions } from '../interfaces/controller.interface';
import { paramExtractorMiddleware } from '../core/param-extractor.middleware';
import { Request, Response, NextFunction } from '../interfaces/http.interface';
import { Logger } from '../utils/logger';

const logger = new Logger();

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'all';

// Interfaz para opciones adicionales en las rutas
export interface RouteOptions {
  /** Middleware a aplicar a esta ruta */
  middleware?: any[];
  /** Opciones de Swagger para esta ruta */
  swagger?: RouteSwaggerOptions;
}

function createRouteDecorator(method: HttpMethod) {
  return (path?: string | RouteOptions, options?: RouteOptions): MethodDecorator => {
    // Normalizar argumentos: si path es un objeto, es realmente options
    let normalizedPath = '';
    let normalizedOptions: RouteOptions | undefined = options;
    
    if (typeof path === 'object') {
      normalizedOptions = path;
    } else if (typeof path === 'string') {
      normalizedPath = path;
    }
    
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
      if (!Reflect.hasMetadata('routes', target.constructor)) {
        Reflect.defineMetadata('routes', [], target.constructor);
      }

      const routes = Reflect.getMetadata('routes', target.constructor) as Array<RouteDefinition>;
      
      // Crear definición de ruta
      const route: RouteDefinition = {
        method,
        path: normalizedPath,
        methodName: propertyKey.toString(),
        handler: descriptor.value,
        middleware: normalizedOptions?.middleware || []
      };
      
      // Añadir opciones de Swagger si se proporcionan
      if (normalizedOptions?.swagger) {
        route.swagger = normalizedOptions.swagger;
      }

      routes.push(route);
      
      // Actualizar los metadatos
      Reflect.defineMetadata('routes', routes, target.constructor);
      
      return descriptor;
    };
  };
}

export const Get = createRouteDecorator('get');
export const Post = createRouteDecorator('post');
export const Put = createRouteDecorator('put');
export const Delete = createRouteDecorator('delete');
export const Patch = createRouteDecorator('patch');
export const Options = createRouteDecorator('options');
export const Head = createRouteDecorator('head');
export const All = createRouteDecorator('all'); 