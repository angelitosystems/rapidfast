import 'reflect-metadata';
import { Entity as EntityDecorator, EntityOptions } from '../orm/entity';

// Re-exportar decoradores
export { EntityOptions };
export { EntityDecorator };

/**
 * Decorador para marcar una clase como una entidad
 * @param nameOrOptions Nombre de la tabla o opciones de entidad
 */
export function Entity(nameOrOptions?: string | EntityOptions): ClassDecorator {
  return EntityDecorator(nameOrOptions);
}