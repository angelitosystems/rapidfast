import 'reflect-metadata';

export function InjectRepository(entityName: string): ParameterDecorator {
  return function(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void {
    if (propertyKey === undefined) return;
    
    const repositories = Reflect.getMetadata('repositories', target.constructor) || [];
    repositories.push({
      parameterIndex,
      entityName,
      propertyKey: propertyKey?.toString(),
    });
    Reflect.defineMetadata('repositories', repositories, target.constructor);
  };
}

export function getRepositoryMetadata(target: any): Array<{ parameterIndex: number; entityName: string; propertyKey?: string }> {
  return Reflect.getMetadata('repositories', target) || [];
}