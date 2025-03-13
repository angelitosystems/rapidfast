import { Type } from './type.interface';

export { Type };

export interface Provider {
  provide: string | symbol | Type<any>;
  useClass?: Type<any>;
  useValue?: any;
  useFactory?: (...args: any[]) => any;
  inject?: Array<Type<any> | string | symbol>;
}

export interface ModuleMetadata {
  imports?: Array<Type<any>>;
  controllers?: Array<Type<any>>;
  providers?: Array<Type<any> | Provider>;
  exports?: Array<Type<any> | string | symbol>;
}

export interface Module {
  controllers: Type[];
  prefix?: string;
  configure(): void;
  onInit?(): Promise<void>;
  onDestroy?(): Promise<void>;
} 