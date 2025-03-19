import 'reflect-metadata';
import { ModuleMetadata } from '../interfaces/module.interface';

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    // Almacenar cada propiedad individualmente
    if (metadata.imports) {
      Reflect.defineMetadata('imports', metadata.imports, target);
    }
    if (metadata.controllers) {
      Reflect.defineMetadata('controllers', metadata.controllers, target);
    }
    if (metadata.providers) {
      Reflect.defineMetadata('providers', metadata.providers, target);
    }
    if (metadata.exports) {
      Reflect.defineMetadata('exports', metadata.exports, target);
    }

    // Almacenar el metadata completo
    Reflect.defineMetadata('module', metadata, target);
  };
} 