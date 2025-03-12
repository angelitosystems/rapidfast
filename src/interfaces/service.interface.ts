export interface Service {
  onInit?(): Promise<void>;
  onDestroy?(): Promise<void>;
}

export interface ServiceMetadata {
  name?: string;
  scope?: 'singleton' | 'request' | 'transient';
  inject?: any[];
}

export interface ServiceFactory<T> {
  create(): Promise<T> | T;
  destroy?(instance: T): Promise<void> | void;
} 