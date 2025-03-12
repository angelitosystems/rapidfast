import 'reflect-metadata';

export interface ColumnOptions {
  type?: string;
  primary?: boolean;
  nullable?: boolean;
  default?: any;
  unique?: boolean;
  length?: number;
}

export function Column(options: ColumnOptions = {}): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const columns = Reflect.getMetadata('columns', target.constructor) || [];
    columns.push({
      name: propertyKey,
      options,
    });
    Reflect.defineMetadata('columns', columns, target.constructor);
  };
}