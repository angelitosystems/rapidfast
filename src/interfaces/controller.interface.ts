import { Request, Response, NextFunction } from './http.interface';
import { Type } from './type.interface';

export interface RouteHandler {
  (req: Request, res: Response, next: NextFunction): Promise<any> | any;
}

export interface Controller extends Type {
  prototype: {
    [key: string]: RouteHandler | any;
  };
}

export interface ControllerMetadata {
  prefix: string;
  routes: RouteDefinition[];
  /** Opciones de Swagger para el controlador */
  swagger?: ControllerSwaggerOptions;
}

/**
 * Opciones de Swagger para controladores
 */
export interface ControllerSwaggerOptions {
  /** Etiquetas para agrupar endpoints */
  tags?: string[];
  /** Descripción para la documentación */
  description?: string;
  /** Metadatos adicionales específicos de Swagger */
  [key: string]: any;
}

export interface RouteDefinition {
  path: string;
  method: string;
  methodName: string;
  handler: RouteHandler;
  middleware?: RouteHandler[];
  controller?: any;
  /** Opciones de Swagger para esta ruta */
  swagger?: RouteSwaggerOptions;
}

/**
 * Opciones de Swagger para rutas
 */
export interface RouteSwaggerOptions {
  /** Resumen de la ruta */
  summary?: string;
  /** Descripción detallada */
  description?: string;
  /** Etiquetas específicas de esta ruta (anulará las del controlador) */
  tags?: string[];
  /** Parámetros de la ruta */
  parameters?: any[];
  /** Cuerpo de la petición */
  requestBody?: any;
  /** Respuestas posibles */
  responses?: Record<string, any>;
} 