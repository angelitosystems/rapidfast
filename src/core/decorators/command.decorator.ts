export interface CommandArgument {
  name: string;
  description: string;
  required?: boolean;
  default?: any;
}

export interface CommandOptions {
  name: string;
  description: string;
  arguments?: CommandArgument[];
}

export function Command(options: CommandOptions) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey && descriptor) {
      // Es un método decorado
      Reflect.defineMetadata('command:method', options, target, propertyKey);
    } else {
      // Es una clase decorada
      Reflect.defineMetadata('command:class', options, target);
    }
    return target;
  };
} 