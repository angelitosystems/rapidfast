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
  declarations?: Array<Type<any>>;
  providers?: Array<Type<any> | Provider>;
  exports?: Array<Type<any> | Provider | string | symbol>;
  controllers?: Array<Type<any>>;
  entities?: Array<Type<any>>;
}

export interface Module {
  controllers: Type<any>[];
  prefix?: string;
  configure(): void;
  onInit?(): Promise<void>;
  onDestroy?(): Promise<void>;
} 