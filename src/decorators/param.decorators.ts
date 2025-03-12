import 'reflect-metadata';

/**
 * Tipos de parámetros que pueden ser inyectados en controladores
 */
export enum ParamType {
  PARAM = 'param',
  QUERY = 'query',
  BODY = 'body',
  HEADERS = 'headers',
  REQUEST = 'request',
  RESPONSE = 'response'
}

/**
 * Decorador para extraer un parámetro de ruta
 * @param name Nombre del parámetro (opcional)
 */
export function Param(name?: string): ParameterDecorator {
  return function(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void {
    if (propertyKey === undefined) return;
    
    const existingParams: any[] = Reflect.getMetadata('params', target, propertyKey) || [];
    existingParams.push({
      index: parameterIndex,
      type: ParamType.PARAM,
      name,
    });
    Reflect.defineMetadata('params', existingParams, target, propertyKey);
  };
}

/**
 * Decorador para extraer datos del cuerpo de la petición
 * @param name Nombre del campo del cuerpo (opcional)
 */
export function Body(name?: string): ParameterDecorator {
  return function(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void {
    if (propertyKey === undefined) return;
    
    const existingParams: any[] = Reflect.getMetadata('params', target, propertyKey) || [];
    existingParams.push({
      index: parameterIndex,
      type: ParamType.BODY,
      name,
    });
    Reflect.defineMetadata('params', existingParams, target, propertyKey);
  };
}

/**
 * Decorador para extraer parámetros de consulta
 * @param name Nombre del parámetro de consulta (opcional)
 */
export function Query(name?: string): ParameterDecorator {
  return function(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void {
    if (propertyKey === undefined) return;
    
    const existingParams: any[] = Reflect.getMetadata('params', target, propertyKey) || [];
    existingParams.push({
      index: parameterIndex,
      type: ParamType.QUERY,
      name,
    });
    Reflect.defineMetadata('params', existingParams, target, propertyKey);
  };
}

/**
 * Decorador para extraer cabeceras de la petición
 * @param name Nombre de la cabecera (opcional)
 */
export function Headers(name?: string): ParameterDecorator {
  return function(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void {
    if (propertyKey === undefined) return;
    
    const existingParams: any[] = Reflect.getMetadata('params', target, propertyKey) || [];
    existingParams.push({
      index: parameterIndex,
      type: ParamType.HEADERS,
      name,
    });
    Reflect.defineMetadata('params', existingParams, target, propertyKey);
  };
}

/**
 * Decorador para inyectar el objeto Request completo
 */
export function Request(): ParameterDecorator {
  return function(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void {
    if (propertyKey === undefined) return;
    
    const existingParams: any[] = Reflect.getMetadata('params', target, propertyKey) || [];
    existingParams.push({
      index: parameterIndex,
      type: ParamType.REQUEST,
    });
    Reflect.defineMetadata('params', existingParams, target, propertyKey);
  };
}

/**
 * Alias para Request
 */
export const Req = Request;

/**
 * Decorador para inyectar el objeto Response
 */
export function Response(): ParameterDecorator {
  return function(target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void {
    if (propertyKey === undefined) return;
    
    const existingParams: any[] = Reflect.getMetadata('params', target, propertyKey) || [];
    existingParams.push({
      index: parameterIndex,
      type: ParamType.RESPONSE,
    });
    Reflect.defineMetadata('params', existingParams, target, propertyKey);
  };
}

/**
 * Alias para Response
 */
export const Res = Response;