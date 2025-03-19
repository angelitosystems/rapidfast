import 'reflect-metadata';
import { ServiceMetadata } from '../interfaces/service.interface';

export function Injectable(metadata: ServiceMetadata = {}): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('injectable', true, target);
    
    if (metadata.name) {
      Reflect.defineMetadata('service:name', metadata.name, target);
    }
    
    if (metadata.scope) {
      Reflect.defineMetadata('service:scope', metadata.scope, target);
    }
    
    if (metadata.inject) {
      Reflect.defineMetadata('service:inject', metadata.inject, target);
    }
  };
} 