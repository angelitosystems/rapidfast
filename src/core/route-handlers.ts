import { Request, Response, NextFunction } from '../interfaces/http.interface';
import { Logger } from '../utils/logger';
import { paramExtractorMiddleware } from './param-extractor.middleware';

const logger = new Logger();

/**
 * Crea un middleware para manejar los parámetros de la ruta
 * @param controllerClass Clase del controlador
 * @param methodName Nombre del método
 */
export function createParamMiddleware(controllerClass: any, methodName: string) {
  return paramExtractorMiddleware(controllerClass, methodName);
}

/**
 * Envuelve un controlador para manejar su resultado y errores
 * @param handler Función manejadora original
 * @param method Método HTTP
 * @param path Ruta
 */
export function wrapRouteHandler(handler: Function, method: string, path: string) {
  return async function(this: any, req: Request & { _params?: any[] }, res: Response, next: NextFunction) {
    try {
      let result;
      
      // Si hay parámetros extraídos, usarlos, sino pasar req, res, next
      if (Array.isArray(req._params)) {
        result = await handler.apply(this, req._params);
      } else {
        result = await handler.call(this, req, res, next);
      }
      
      // Si ya se ha enviado una respuesta, no hacer nada
      if (res.writableEnded) {
        return;
      }
      
      // Si el resultado es undefined y no se ha enviado respuesta, enviar 204
      if (result === undefined) {
        return res.status(204).end();
      }
      
      // Enviar el resultado como JSON
      res.json(result);
    } catch (error) {
      logger.error(`Error en ruta ${method.toUpperCase()} ${path}:`, error);
      next(error);
    }
  };
}

/**
 * Procesa los middleware y manejadores de ruta
 * @param controllerClass Clase del controlador
 * @param methodName Nombre del método 
 * @param handler Manejador de la ruta
 * @param method Método HTTP
 * @param path Ruta
 * @param middleware Middleware adicional
 */
export function processRouteHandlers(
  controllerClass: any,
  methodName: string,
  handler: Function,
  method: string,
  path: string,
  middleware: any[] = []
) {
  // Crear middleware para extracción de parámetros
  const paramMiddleware = createParamMiddleware(controllerClass, methodName);
  
  // Envolver el handler para manejar resultados y errores
  const wrappedHandler = wrapRouteHandler(handler, method, path);
  
  // Devolver array con todos los middleware + handler
  return [...middleware, paramMiddleware, wrappedHandler];
} 