import 'reflect-metadata';

export interface RelationOptions {
  eager?: boolean;
  cascade?: boolean | string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'NO ACTION';
}

export function OneToMany(type: () => any, inverseSide: string, options: RelationOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const relations = Reflect.getMetadata('relations', target.constructor) || [];
    relations.push({
      type: 'one-to-many',
      propertyKey,
      targetEntity: type,
      inverseSide,
      options,
    });
    Reflect.defineMetadata('relations', relations, target.constructor);
  };
}

export function ManyToOne(type: () => any, options: RelationOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const relations = Reflect.getMetadata('relations', target.constructor) || [];
    relations.push({
      type: 'many-to-one',
      propertyKey,
      targetEntity: type,
      options,
    });
    Reflect.defineMetadata('relations', relations, target.constructor);
  };
}

export function OneToOne(type: () => any, inverseSide?: string, options: RelationOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const relations = Reflect.getMetadata('relations', target.constructor) || [];
    relations.push({
      type: 'one-to-one',
      propertyKey,
      targetEntity: type,
      inverseSide,
      options,
    });
    Reflect.defineMetadata('relations', relations, target.constructor);
  };
}

export function ManyToMany(type: () => any, inverseSide: string, options: RelationOptions = {}): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const relations = Reflect.getMetadata('relations', target.constructor) || [];
    relations.push({
      type: 'many-to-many',
      propertyKey,
      targetEntity: type,
      inverseSide,
      options,
    });
    Reflect.defineMetadata('relations', relations, target.constructor);
  };
}