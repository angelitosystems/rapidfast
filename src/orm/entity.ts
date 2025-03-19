import 'reflect-metadata';
import { Entity as TypeOrmEntity, EntityOptions } from 'typeorm';

// Re-exportar decoradores de TypeORM
export { EntityOptions };

// Exportar el decorador Entity con las sobrecargas correctas
export function Entity(nameOrOptions?: string | EntityOptions): ClassDecorator;
export function Entity(name?: string, options?: EntityOptions): ClassDecorator;
export function Entity(nameOrOptions?: string | EntityOptions, maybeOptions?: EntityOptions): ClassDecorator {
  if (typeof nameOrOptions === 'string') {
    return TypeOrmEntity(nameOrOptions, maybeOptions);
  }
  return TypeOrmEntity(nameOrOptions);
}