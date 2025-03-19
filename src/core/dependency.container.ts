import { Type } from '../interfaces/type.interface';
import { Logger } from '../utils/logger';
import { Provider } from '../interfaces/module.interface';
import 'reflect-metadata';

export class DependencyContainer {
  private services = new Map<any, any>();
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  register(provider: Type<any> | Provider): void {
    try {
      if (this.isProvider(provider)) {
        // Registrar provider especial
        const { provide, useClass, useValue, useFactory } = provider;
        
        if (useValue !== undefined) {
          this.services.set(provide, useValue);
        } else if (useFactory) {
          // Implementar manejo de factory si es necesario
          const dependencies = provider.inject?.map(dep => this.resolve(dep)) || [];
          const instance = useFactory(...dependencies);
          this.services.set(provide, instance);
        } else if (useClass) {
          // Crear instancia de la clase especificada
          this.services.set(provide, this.instantiate(useClass));
        }
      } else {
        // Registrar proveedor normal (clase)
        const token = provider;
        if (!this.services.has(token)) {
          this.services.set(token, this.instantiate(token));
        }
      }
    } catch (error) {
      this.logger.error(`Error registrando provider ${typeof provider === 'function' ? provider.name : 'object'}:`, error);
      throw error;
    }
  }

  resolve<T>(token: Type<T> | symbol | string): T {
    if (!this.services.has(token)) {
      if (typeof token === 'function') {
        this.services.set(token, this.instantiate(token));
      } else {
        throw new Error(`Servicio no registrado: ${String(token)}`);
      }
    }
    return this.services.get(token);
  }

  private instantiate<T>(target: Type<T>): T {
    // Verificar si es un servicio injectable
    const isController = Reflect.hasMetadata('controller', target);
    
    // Solo mostrar advertencia si no es un controlador y no tiene el decorador @Injectable
    if (!Reflect.getMetadata('injectable', target) && !isController) {
      this.logger.warn(`Clase ${target.name} no marcada como @Injectable()`);
    }

    // Buscar parámetros a inyectar
    const params = Reflect.getMetadata('design:paramtypes', target) || [];
    const injections = params.map((param: Type<any>) => {
      return this.resolve(param);
    });

    // Crear instancia con dependencias inyectadas
    return new target(...injections);
  }

  private isProvider(provider: any): provider is Provider {
    return provider && 'provide' in provider;
  }
}
