import 'reflect-metadata';
import { getRepository } from 'typeorm';
import { DatabaseManager } from '../core/database.manager';
import { isCliMode } from '../utils/cli';

/**
 * Decorador para inyectar un repositorio de TypeORM
 * @param entity Entidad para la que se quiere obtener el repositorio
 */
export function InjectRepository(entity: any): any {
  return function (target: any, propertyKey: string) {
    // En modo CLI, no hacer nada
    if (isCliMode()) {
      return;
    }

    // Definir un getter para la propiedad
    Object.defineProperty(target, propertyKey, {
      get: function() {
        // Obtener el repositorio del DatabaseManager
        return DatabaseManager.getInstance().getRepository(entity);
      },
      enumerable: true,
      configurable: true
    });
  };
}

export function getRepositoryMetadata(target: any): Array<{ parameterIndex: number; entityName: string; propertyKey?: string }> {
  return Reflect.getMetadata('repositories', target) || [];
}