import 'reflect-metadata';
import { ControllerMetadata } from '../interfaces/controller.interface';

export function Controller(prefix: string = ''): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('prefix', prefix, target);
    
    // Asegurarse de que exista el metadata de rutas
    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target);
    }

    // Almacenar metadata del controlador
    const metadata: ControllerMetadata = {
      prefix,
      routes: Reflect.getMetadata('routes', target) || [],
    };

    Reflect.defineMetadata('controller', metadata, target);
  };
} 