import { faker as fakerjs } from '@faker-js/faker';
import { EntityTarget } from 'typeorm';

export const faker = fakerjs;

export type FactoryFunction<T> = () => Partial<T>;

export function Factory<T>(entity: EntityTarget<T>) {
  return (factoryFn: FactoryFunction<T>) => {
    const factory = {
      create: async () => {
        const data = factoryFn();
        return data;
      },
      createMany: async (count: number) => {
        const items: Partial<T>[] = [];
        for (let i = 0; i < count; i++) {
          items.push(factoryFn());
        }
        return items;
      },
      hash: async (value: string) => {
        // Implementación básica de hash para desarrollo
        return Buffer.from(value).toString('base64');
      }
    };
    return factory;
  };
}