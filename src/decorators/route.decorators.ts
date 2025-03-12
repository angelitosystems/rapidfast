import 'reflect-metadata';
import { RouteDefinition, RouteHandler } from '../interfaces/controller.interface';
import { paramExtractorMiddleware } from '../core/param-extractor.middleware';
import { Request, Response, NextFunction } from '../interfaces/http.interface';

function createRouteDecorator(method: string) {
  return function (path: string = '') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      if (!Reflect.hasMetadata('routes', target.constructor)) {
        Reflect.defineMetadata('routes', [], target.constructor);
      }

      // Guardar el handler original
      const originalHandler = descriptor.value;

      // Crear un nuevo handler que utilice los parámetros extraídos
      descriptor.value = async function(req: any, res: any, next: any) {
        // Si hay parámetros extraídos, utilizarlos
        if (req._params) {
          return originalHandler.apply(this, req._params);
        }
        
        // Si no hay parámetros extraídos, utilizar los parámetros estándar
        return originalHandler.call(this, req, res, next);
      };

      const routes = Reflect.getMetadata('routes', target.constructor) as RouteDefinition[];
      
      // Crear un middleware con el tipo correcto
      const paramMiddleware = function(req: any, res: any, next: any) {
        return paramExtractorMiddleware(target.constructor, propertyKey)(req, res, next);
      };
      
      routes.push({
        method,
        path,
        methodName: propertyKey,
        handler: descriptor.value,
        middleware: [paramMiddleware],
      });

      Reflect.defineMetadata('routes', routes, target.constructor);
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