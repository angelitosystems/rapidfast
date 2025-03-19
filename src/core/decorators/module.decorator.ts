export interface ModuleOptions {
  providers?: any[];
  imports?: any[];
  exports?: any[];
  controllers?: any[];
}

export function Module(options: ModuleOptions = {}) {
  return function (target: any) {
    Reflect.defineMetadata('module:options', options, target);
    return target;
  };
} 