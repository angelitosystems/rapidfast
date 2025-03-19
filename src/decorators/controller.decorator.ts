import 'reflect-metadata';
import { ControllerMetadata } from '../interfaces/controller.interface';

/**
 * Opciones que se pueden proporcionar al decorador de controlador
 */
export interface ControllerOptions {
  /**
   * Prefijo para todas las rutas del controlador
   */
  prefix: string;
  
  /**
   * Tags para agrupar endpoints en Swagger UI
   */
  tags?: string[];
  
  /**
   * Descripción del controlador para la documentación Swagger
   */
  description?: string;
}

/**
 * Decorador para marcar una clase como controlador
 * @param prefixOrOptions Prefijo de ruta o opciones del controlador
 */
export function Controller(prefixOrOptions: string | ControllerOptions): ClassDecorator {
  // Normalizar opciones
  const options: ControllerOptions = typeof prefixOrOptions === 'string'
    ? { prefix: prefixOrOptions }
    : prefixOrOptions;
  
  const { prefix, tags, description } = options;
  
  return (target: any) => {
    // Definir metadatos para el controlador
    const metadata: ControllerMetadata = {
      prefix,
      routes: Reflect.getMetadata('routes', target) || []
    };
    
    // Guardar metadatos del controlador
    Reflect.defineMetadata('controller', metadata, target);
    Reflect.defineMetadata('prefix', prefix, target);
    
    // Definir metadatos para Swagger si se proporcionan
    if (tags && tags.length > 0) {
      Reflect.defineMetadata('swagger:tags', tags, target);
    }
    
    if (description) {
      Reflect.defineMetadata('swagger:description', description, target);
    }
    
    // Generar un tag basado en el nombre del controlador si no se proporciona uno
    if (!tags || tags.length === 0) {
      const className = target.name;
      // Eliminar sufijo 'Controller' si existe
      const tagName = className.endsWith('Controller') 
        ? className.substring(0, className.length - 10) 
        : className;
      
      Reflect.defineMetadata('swagger:tags', [tagName], target);
    }
    
    // Registrar metadatos adicionales para Swagger
    Reflect.defineMetadata('swagger:controller', {
      prefix,
      tags: tags || [],
      description: description || `API de ${target.name}`
    }, target);
  };
} 