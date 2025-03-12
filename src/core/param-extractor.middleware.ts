import 'reflect-metadata';
import { Request, Response, NextFunction } from '../interfaces/http.interface';

/**
 * Middleware para extraer parámetros de la solicitud según los decoradores
 * @param controllerClass Clase del controlador
 * @param methodName Nombre del método
 */
export function paramExtractorMiddleware(controllerClass: any, methodName: string) {
  return async (req: any, res: any, next: any) => {
    try {
      // Obtener los metadatos de parámetros
      const paramMetadata = Reflect.getMetadata('params', controllerClass.prototype, methodName) || [];
      
      // Si no hay metadatos, continuar
      if (!paramMetadata.length) {
        return next();
      }
      
      // Ordenar los parámetros por índice
      paramMetadata.sort((a: any, b: any) => a.index - b.index);
      
      // Añadir los parámetros a la solicitud para que estén disponibles en el controlador
      req._params = [];
      
      // Resolver cada parámetro
      for (const param of paramMetadata) {
        let value: any;
        
        switch (param.type) {
          case 'param':
            value = req.params[param.name];
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
        
        // Almacenar el valor en la solicitud
        req._params[param.index] = value;
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
} 