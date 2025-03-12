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

export interface ParamMetadata {
  index: number;
  type: ParamType;
  name?: string;
}
