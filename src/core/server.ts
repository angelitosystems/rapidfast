import { createServer, Server as HttpServer, IncomingMessage, ServerResponse } from 'http';
import { Logger } from '../utils/logger';
import { RouteDefinition } from '../interfaces/controller.interface';
import { Request, Response, NextFunction } from '../interfaces/http.interface';

export class Server {
  private server: HttpServer;
  private routes: Map<string, RouteDefinition[]>;
  private logger: Logger;

  constructor() {
    this.routes = new Map();
    this.logger = new Logger();
    this.server = createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const { url, method } = req;
    const path = url?.split('?')[0] || '/';
    
    try {
      // Buscar la ruta que coincida
      const routeHandler = this.findRouteHandler(path, method || 'GET');
      
      if (!routeHandler) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
        return;
      }

      // Procesar el body si existe
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          // Crear objetos req y res compatibles con express
          const request = this.createExpressRequest(req, {
            params: this.extractParams(path, routeHandler.path),
            query: this.parseQueryString(url || ''),
            body: body ? JSON.parse(body) : {},
          });

          const response = this.createExpressResponse(res);
          
          // Función next para middleware
          const next: NextFunction = (error?: any) => {
            if (error) {
              res.writeHead(500);
              res.end(JSON.stringify({ error: error.message || 'Error interno del servidor' }));
            }
          };

          // Ejecutar middleware si existe
          if (routeHandler.middleware) {
            for (const middleware of routeHandler.middleware) {
              await middleware(request, response, next);
            }
          }

          // Ejecutar el handler
          const result = await routeHandler.handler(request, response, next);
          
          // Si el resultado no es undefined y la respuesta no se ha enviado, enviarla
          if (result !== undefined && !response.writableEnded) {
            response.json(result);
          }
        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Error interno del servidor' }));
        }
      });
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Error interno del servidor' }));
    }
  }

  private createExpressRequest(req: IncomingMessage, extras: any): Request {
    return Object.assign(req, extras) as Request;
  }

  private createExpressResponse(res: ServerResponse): Response {
    const response = res as Response;
    
    // Agregar métodos comunes de express
    response.status = function(code: number) {
      res.statusCode = code;
      return this;
    };

    response.json = function(body: any) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
      return this;
    };

    response.send = function(body: any) {
      if (typeof body === 'object') {
        return response.json(body);
      }
      res.end(body);
      return this;
    };

    return response;
  }

  private findRouteHandler(path: string, method: string): RouteDefinition | undefined {
    for (const [prefix, routes] of this.routes) {
      const matchingRoute = routes.find(route => {
        const fullPath = prefix + route.path;
        return this.pathMatches(path, fullPath) && route.method === method;
      });
      
      if (matchingRoute) {
        return matchingRoute;
      }
    }
    return undefined;
  }

  private pathMatches(requestPath: string, routePath: string): boolean {
    const requestParts = requestPath.split('/').filter(Boolean);
    const routeParts = routePath.split('/').filter(Boolean);

    if (requestParts.length !== routeParts.length) {
      return false;
    }

    return routeParts.every((part, i) => {
      return part.startsWith(':') || part === requestParts[i];
    });
  }

  private extractParams(requestPath: string, routePath: string): Record<string, string> {
    const params: Record<string, string> = {};
    const requestParts = requestPath.split('/').filter(Boolean);
    const routeParts = routePath.split('/').filter(Boolean);

    routeParts.forEach((part, i) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params[paramName] = requestParts[i];
      }
    });

    return params;
  }

  private parseQueryString(url: string): Record<string, string> {
    const queryString = url.split('?')[1] || '';
    const params: Record<string, string> = {};

    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key) {
        params[key] = decodeURIComponent(value || '');
      }
    });

    return params;
  }

  public addRoutes(prefix: string, routes: RouteDefinition[]): void {
    this.routes.set(prefix, routes);
  }

  public listen(port: number, callback?: () => void): void {
    this.server.listen(port, () => {
      this.logger.info(`🚀 Servidor escuchando en el puerto ${port}`);
      callback?.();
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
} 