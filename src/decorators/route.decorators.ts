import 'reflect-metadata';
import { RouteDefinition, RouteHandler } from '../interfaces/controller.interface';
import { paramExtractorMiddleware } from '../core/param-extractor.middleware';
import { Request, Response, NextFunction } from '../interfaces/http.interface';
import { Logger } from '../utils/logger';

const logger = new Logger();

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

function createRouteDecorator(method: HttpMethod) {
  return function (path: string = '/'): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
      if (!Reflect.hasMetadata('routes', target.constructor)) {
        Reflect.defineMetadata('routes', [], target.constructor);
      }

      const routes = Reflect.getMetadata('routes', target.constructor) as RouteDefinition[];

      // Envolver el handler original para manejar parámetros y errores
      const originalHandler = descriptor.value;
      descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
        try {
          const result = Array.isArray(req.params)
            ? await originalHandler.apply(this, req.params)
            : await originalHandler.call(this, req, res, next);

          if (result !== undefined && !res.writableEnded) {
            res.json(result);
          }
        } catch (error) {
          logger.error(`Error en ruta ${method.toUpperCase()} ${path}:`, error);
          next(error);
        }
      };

      // Registrar la ruta
      routes.push({
        path,
        method,
        methodName: propertyKey as string,
        handler: descriptor.value,
        middleware: Reflect.getMetadata('middleware', target, propertyKey as string) || []
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