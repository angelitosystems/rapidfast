import { Request, Response, NextFunction } from './http.interface';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head';

export interface Route {
  path: string;
  method: HttpMethod;
  handler: RouteHandler;
  middleware?: RouteHandler[];
}

export interface RouteHandler {
  (req: Request, res: Response, next: NextFunction): Promise<any> | any;
}

export interface RouteOptions {
  middleware?: RouteHandler[];
  validate?: {
    body?: any;
    query?: any;
    params?: any;
  };
  description?: string;
  deprecated?: boolean;
  tags?: string[];
} 