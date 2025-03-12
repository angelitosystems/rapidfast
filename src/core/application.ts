import { Server } from './server';
import { RouteDefinition } from '../interfaces/controller.interface';
import { Logger } from '../utils/logger';
import { Type } from '../interfaces/type.interface';
import { ModuleMetadata } from '../interfaces/module.interface';
import 'reflect-metadata';

export class RapidFastApplication {
  private server: Server;
  private logger: Logger;
  private modules: Type[] = [];

  constructor() {
    this.server = new Server();
    this.logger = new Logger();
  }

  /**
   * Registra un módulo en la aplicación
   * @param module Módulo a registrar
   * @deprecated Use initialize([module]) instead
   */
  public async register(module: Type): Promise<void> {
    this.modules.push(module);
    await this.initialize([module]);
    return;
  }

  public async initialize(modules: Type[]): Promise<void> {
    try {
      for (const module of modules) {
        const metadata: ModuleMetadata = Reflect.getMetadata('module', module) || {};
        
        if (metadata.controllers) {
          for (const controller of metadata.controllers) {
            const prefix: string = Reflect.getMetadata('prefix', controller) || '';
            const routes: RouteDefinition[] = Reflect.getMetadata('routes', controller) || [];
            
            // Registrar las rutas en el servidor
            this.server.addRoutes(prefix, routes);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error al inicializar la aplicación:', error);
      throw error;
    }
  }

  /**
   * Inicia el servidor en el puerto y host especificados
   * @param port Puerto en el que escuchar
   * @param host Host en el que escuchar (opcional)
   * @param callback Función a ejecutar cuando el servidor esté listo (opcional)
   */
  public listen(port: number, host?: string | (() => void), callback?: () => void): void {
    // Si el segundo parámetro es una función, es el callback
    if (typeof host === 'function') {
      callback = host;
      host = undefined;
    }
    
    this.server.listen(port, callback);
  }

  public async close(): Promise<void> {
    await this.server.close();
  }
}

// Exportar la clase también como Application para mantener compatibilidad
export { RapidFastApplication as Application };