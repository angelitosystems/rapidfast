import 'reflect-metadata';
import { ModuleMetadata } from '../interfaces/module.interface';

export abstract class Module {
  static forRoot(metadata: ModuleMetadata): ClassDecorator {
    return (target: any) => {
      Reflect.defineMetadata('module', metadata, target);
    };
  }

  static forFeature(metadata: ModuleMetadata): ClassDecorator {
    return (target: any) => {
      Reflect.defineMetadata('module', metadata, target);
    };
  }

  async onInit(): Promise<void> {
    // Hook para inicialización del módulo
  }

  async onDestroy(): Promise<void> {
    // Hook para limpieza del módulo
  }
} 