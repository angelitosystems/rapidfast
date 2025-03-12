import 'reflect-metadata';

export function Inject(token: string | symbol | any): ParameterDecorator {
  return function(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void {
    if (propertyKey === undefined) return;
    
    const existingInjections = Reflect.getMetadata('inject:params', target.constructor) || [];
    existingInjections.push({
      index: parameterIndex,
      token,
    });
    Reflect.defineMetadata('inject:params', existingInjections, target.constructor);
  };
}

export function getInjections(target: any): Array<{ index: number; token: string | symbol | any }> {
  return Reflect.getMetadata('inject:params', target) || [];
}