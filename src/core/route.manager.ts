import { Router, Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { RouteDefinition } from '../interfaces/controller.interface';
import { SwaggerManager } from './swagger';
import chalk from 'chalk';

export class RouteManager {
  private router: Router;
  private logger: Logger;
  private routes: Map<string, RouteDefinition[]>;
  private swaggerManager: SwaggerManager;

  constructor() {
    this.router = Router();
    this.logger = new Logger();
    this.routes = new Map();
    this.swaggerManager = new SwaggerManager();
  }

  public registerRoutes(prefix: string, routes: RouteDefinition[]): void {
    const normalizedPrefix = this.normalizePath(prefix);
    
    routes.forEach(route => {
      const { method, path, handler, middleware = [] } = route;
      const fullPath = this.normalizePath(normalizedPrefix + path);
      
      // Registrar la ruta en Express usando una aserción de tipo segura
      const routeMethod = method.toLowerCase() as keyof Pick<Router, 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'>;
      this.router[routeMethod](
        fullPath,
        ...middleware,
        this.createRouteHandler(route)
      );

      // Almacenar la ruta para referencia
      if (!this.routes.has(normalizedPrefix)) {
        this.routes.set(normalizedPrefix, []);
      }
      this.routes.get(normalizedPrefix)?.push(route);

      this.logRouteRegistration(method, fullPath);
    });
  }

  private createRouteHandler(route: RouteDefinition) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await route.handler.call(route.controller, req, res, next);
        if (result !== undefined && !res.headersSent) {
          res.json(result);
        }
      } catch (error) {
        next(error);
      }
    };
  }

  public registerSwagger(path: string, options: any): void {
    this.swaggerManager.initialize(options);
    const { serve, setup } = this.swaggerManager.getMiddleware();
    
    // Registrar rutas de Swagger
    const normalizedPath = this.normalizePath(path);
    this.router.use(normalizedPath, serve, setup);
    
    // Registrar ruta para swagger.json
    this.router.get('/swagger.json', (req: Request, res: Response) => {
      res.json(this.swaggerManager.getSpec());
    });

    this.logger.info(`📚 Swagger UI disponible en ${normalizedPath}`);
  }

  private normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  private logRouteRegistration(method: string, path: string): void {
    const colorMethod = this.getMethodColor(method)(method.toUpperCase().padEnd(6));
    this.logger.debug(`${chalk.gray('[')}${colorMethod}${chalk.gray(']')} ${path}`);
  }

  private getMethodColor(method: string): (text: string) => string {
    const colors: { [key: string]: (text: string) => string } = {
      get: chalk.green,
      post: chalk.yellow,
      put: chalk.blue,
      delete: chalk.red,
      patch: chalk.magenta,
      options: chalk.cyan,
      head: chalk.gray
    };
    return colors[method.toLowerCase()] || chalk.white;
  }

  public getRouter(): Router {
    return this.router;
  }

  public getRegisteredRoutes(): Map<string, RouteDefinition[]> {
    return this.routes;
  }

  public printRoutes(): void {
    this.logger.info('\n📋 Rutas registradas:');
    
    this.routes.forEach((routes, prefix) => {
      if (routes.length > 0) {
        this.logger.info(`\n${chalk.cyan(prefix || '/')}:`);
        routes.forEach(route => {
          const method = this.getMethodColor(route.method)(route.method.toUpperCase().padEnd(6));
          this.logger.info(`  ${chalk.gray('[')}${method}${chalk.gray(']')} ${route.path}`);
        });
      }
    });
  }
} 