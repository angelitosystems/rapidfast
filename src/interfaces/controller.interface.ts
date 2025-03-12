import { Request, Response, NextFunction } from './http.interface';

export interface RouteHandler {
  (req: Request, res: Response, next: NextFunction): Promise<any> | any;
}

export interface Controller {
  [key: string]: RouteHandler | any;
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
} 