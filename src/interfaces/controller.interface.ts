import { Request, Response, NextFunction } from './http.interface';
import { Type } from './type.interface';

export interface RouteHandler {
  (req: Request, res: Response, next: NextFunction): Promise<any> | any;
}

export interface Controller extends Type {
  prototype: {
    [key: string]: RouteHandler | any;
  };
}

export interface ControllerMetadata {
  prefix: string;
  routes: RouteDefinition[];
}

export interface RouteDefinition {
  path: string;
  method: string;
  methodName: string;
  handler: RouteHandler;
  middleware?: RouteHandler[];
  controller?: any;
} 