import 'reflect-metadata';
import { Request, Response, NextFunction } from '../interfaces/http.interface';
import { ParamMetadata } from '../interfaces/param.interface';

/**
 * Middleware para extraer parámetros de la solicitud según los decoradores
 * @param controllerClass Clase del controlador
 * @param methodName Nombre del método
 */
export function paramExtractorMiddleware(controllerClass: any, methodName: string) {
  return async (req: Request & { _params?: any[] }, res: Response, next: NextFunction) => {
    try {
      // Obtener los metadatos de parámetros
      const paramMetadata: ParamMetadata[] = Reflect.getMetadata('params', controllerClass.prototype, methodName) || [];
      
      // Si no hay metadatos, continuar
      if (!paramMetadata.length) {
        return next();
      }
      
      // Ordenar los parámetros por índice
      paramMetadata.sort((a, b) => a.index - b.index);
      
      // Añadir los parámetros a la solicitud para que estén disponibles en el controlador
      req._params = [];
      
      // Resolver cada parámetro
      for (const param of paramMetadata) {
        let value: any;
        
        switch (param.type) {
          case 'param':
            value = param.name ? req.params[param.name] : undefined;
            break;
          case 'body':
            value = req.body;
            break;
          case 'query':
            value = req.query;
            break;
          case 'headers':
            value = req.headers;
            break;
          case 'request':
            value = req;
            break;
          case 'response':
            value = res;
            break;
          default:
            value = undefined;
        }
        
        // Validar y transformar el valor si es necesario
        if (param.transform) {
          try {
            value = await param.transform(value);
          } catch (error) {
            return next(error);
          }
        }
        
        // Almacenar el valor en la solicitud
        if (Array.isArray(req._params)) {
          req._params[param.index] = value;
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
} 