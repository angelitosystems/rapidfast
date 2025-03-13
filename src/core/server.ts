import express, { Express, Request, Response, NextFunction, Router } from 'express';
import { Logger } from '../utils/logger';
import { RouteDefinition } from '../interfaces/controller.interface';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import chalk from 'chalk';  // Añadimos esta importación

export class Server {
  private app: Express;
  private logger: Logger;
  private router: Router;

  constructor() {
    this.app = express();
    this.logger = new Logger();
    this.router = express.Router();
    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    // Middleware básico
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors());
    this.app.use(helmet({
      contentSecurityPolicy: false // Para permitir que Swagger UI funcione correctamente
    }));
    this.app.use(compression());

    // Logging en desarrollo
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    // Montar el router principal
    this.app.use('/', this.router);

    // Manejo de errores global
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Error no manejado:', err);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });
  }

  public addRoutes(prefix: string, routes: RouteDefinition[]): void {
    // Para compatibilidad con versiones anteriores, crear rutas sin controlador
    for (const route of routes) {
      const { method, path, handler, middleware = [] } = route;
      const routePath = this.normalizePath(prefix, path);
      
      // Usar el método adecuado en función del método HTTP
      this.registerRouteHandler(method, routePath, middleware, handler);
      this.logger.debug(`[${method.toUpperCase().padEnd(6)}] ${routePath}`);
    }
  }

  public addRoutesWithController(prefix: string, routes: RouteDefinition[], controller: any): void {
    for (const route of routes) {
      const { method, path, methodName, middleware = [] } = route;
      const routePath = this.normalizePath(prefix, path);
      
      const handler = controller[methodName].bind(controller);
      
      // Usar el método adecuado en función del método HTTP
      this.registerRouteHandler(method, routePath, middleware, handler);
      this.logger.debug(`[${method.toUpperCase().padEnd(6)}] ${routePath}`);
    }
  }

  // Método auxiliar para registrar rutas según el verbo HTTP
  private registerRouteHandler(
    method: string, 
    path: string, 
    middleware: any[], 
    handler: any
  ): void {
    switch (method.toLowerCase()) {
      case 'get':
        this.router.get(path, ...middleware, handler);
        break;
      case 'post':
        this.router.post(path, ...middleware, handler);
        break;
      case 'put':
        this.router.put(path, ...middleware, handler);
        break;
      case 'delete':
        this.router.delete(path, ...middleware, handler);
        break;
      case 'patch':
        this.router.patch(path, ...middleware, handler);
        break;
      case 'options':
        this.router.options(path, ...middleware, handler);
        break;
      case 'head':
        this.router.head(path, ...middleware, handler);
        break;
      default:
        this.logger.warn(`Método HTTP no soportado: ${method}`);
    }
  }

  private normalizePath(prefix: string, path: string): string {
    // Asegurarse de que el path comience con /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const normalizedPrefix = prefix ? (prefix.startsWith('/') ? prefix : `/${prefix}`) : '';
    
    return `${normalizedPrefix}${normalizedPath}`;
  }

  public setupSwagger(options: any, controllers?: any[]): void {
    const swaggerDocument = {
      openapi: '3.0.0',
      info: {
        title: options.title || 'RapidFAST API',
        description: options.description || 'API Documentation',
        version: options.version || '1.0.0',
      },
      servers: [
        {
          url: '/',
          description: 'Development server',
        },
      ],
      paths: {},
      components: {
        schemas: {},
      },
      tags: [],
    };
    
    // Procesar los controladores y sus metadatos
    if (controllers && controllers.length > 0) {
      this.processControllersForSwagger(swaggerDocument, controllers);
    } else {
      // Escanear las rutas registradas para documentación
      this.scanRoutesForSwagger(swaggerDocument);
    }

    // Generar rutas para Swagger
    this.router.use('/api-docs', swaggerUi.serve);
    this.router.get('/api-docs', swaggerUi.setup(swaggerDocument));
    
    // Endpoint para el archivo JSON de Swagger
    this.router.get('/swagger.json', (req, res) => {
      res.json(swaggerDocument);
    });
  }
  
  /**
   * Procesa los controladores para generar documentación Swagger
   */
  private processControllersForSwagger(swaggerDocument: any, controllers: any[]): void {
    // Definir interfaces para los documentos Swagger
    interface SwaggerMethodDoc {
      summary: string;
      description: string;
      tags?: string[];
      parameters: any[];
      requestBody?: any;
      responses: Record<string, any>;
    }
    
    for (const controller of controllers) {
      // Extraer metadatos del controlador
      const apiDoc = Reflect.getMetadata('swagger:api', controller.constructor);
      const prefix = Reflect.getMetadata('prefix', controller.constructor) || '';
      const routes = Reflect.getMetadata('routes', controller.constructor) || [];
      
      // Añadir tags del controlador
      if (apiDoc && apiDoc.tags) {
        for (const tag of Array.isArray(apiDoc.tags) ? apiDoc.tags : [apiDoc.tags]) {
          swaggerDocument.tags.push({
            name: tag,
            description: apiDoc.description || `API endpoints for ${tag}`
          });
        }
      }
      
      // Procesar rutas
      for (const route of routes) {
        const { path, method, methodName } = route;
        const fullPath = this.normalizePath(prefix, path);
        
        // Crear objeto de ruta si no existe
        if (!swaggerDocument.paths[fullPath]) {
          swaggerDocument.paths[fullPath] = {};
        }
        
        // Extraer metadatos del método
        const methodDoc: SwaggerMethodDoc = {
          summary: `${methodName}`,
          description: '',
          parameters: [],
          responses: {}
        };
        
        // Añadir tags del controlador
        if (apiDoc && apiDoc.tags) {
          methodDoc.tags = Array.isArray(apiDoc.tags) ? apiDoc.tags : [apiDoc.tags];
        }
        
        // Procesar parámetros
        const params = Reflect.getMetadata('swagger:params', controller.constructor.prototype, methodName) || [];
        for (const param of params) {
          methodDoc.parameters.push({
            name: param.name,
            in: 'path',
            description: param.description || '',
            required: param.required !== false,
            schema: param.schema || { type: 'string' }
          });
        }
        
        // Procesar cuerpo
        const body = Reflect.getMetadata('swagger:body', controller.constructor.prototype, methodName);
        if (body) {
          methodDoc.requestBody = {
            description: body.description || '',
            required: body.required !== false,
            content: body.content || {
              'application/json': {
                schema: body.schema || { type: 'object' }
              }
            }
          };
        }
        
        // Procesar respuestas
        const responses = Reflect.getMetadata('swagger:responses', controller.constructor.prototype, methodName) || [];
        for (const response of responses) {
          methodDoc.responses[response.status || 200] = {
            description: response.description || 'Successful response',
            content: response.content || (response.type ? {
              'application/json': {
                schema: {
                  type: Array.isArray(response.type) ? 'array' : 'object',
                  items: Array.isArray(response.type) ? { type: 'object' } : undefined
                }
              }
            } : undefined)
          };
        }
        
        // Añadir método al path
        swaggerDocument.paths[fullPath][method.toLowerCase()] = methodDoc;
      }
    }
  }
  
  /**
   * Escanea rutas existentes para generar documentación básica
   */
  private scanRoutesForSwagger(swaggerDocument: any): void {
    if (this.router && Array.isArray(this.router.stack)) {
      this.router.stack.forEach((layer: any) => {
        if (layer.route) {
          const path = layer.route.path;
          const methods = (layer.route as any)?.methods || {};
          
          if (!swaggerDocument.paths[path]) {
            swaggerDocument.paths[path] = {};
          }
          
          Object.keys(methods).forEach(method => {
            if (methods[method]) {
              swaggerDocument.paths[path][method] = {
                summary: `${method.toUpperCase()} ${path}`,
                parameters: [],
                responses: {
                  '200': {
                    description: 'Successful operation'
                  }
                }
              };
            }
          });
        }
      });
    }
  }

  public listen(port: number, callback?: () => void): void {
    this.app.listen(port, () => {
      // Primero mostrar el banner bonito
      this.displayServerBanner(port);
      
      // Luego imprimir las rutas registradas
      this.printRoutes();
      
      if (callback) callback();
    });
  }

  private displayServerBanner(port: number): void {
    const mode = process.env.NODE_ENV || 'desarrollo';
    const watchStatus = process.env.WATCH !== 'false' ? 'activado' : 'desactivado';
    
    // Banner mejorado con colores y mejor diseño
    const banner = `
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  ${chalk.bold.green('🚀')} ${chalk.bold.blue('RapidFAST Framework')} ${chalk.gray('v' + (require('../../package.json').version))}                             │
│                                                                   │
│  ${chalk.cyan('▸')} ${chalk.white('Local:')}            ${chalk.green(`http://localhost:${port}`)}                │
│  ${chalk.cyan('▸')} ${chalk.white('Swagger UI:')}       ${chalk.green(`http://localhost:${port}/api-docs`)}       │
│  ${chalk.cyan('▸')} ${chalk.white('Swagger JSON:')}     ${chalk.green(`http://localhost:${port}/swagger.json`)}   │
│  ${chalk.cyan('▸')} ${chalk.white('Modo:')}             ${chalk.yellow(mode)}                           │
│  ${chalk.cyan('▸')} ${chalk.white('RapidWatch™:')}      ${watchStatus === 'activado' ? chalk.green(watchStatus) : chalk.red(watchStatus)}                             │
│                                                                   │
│  ${chalk.gray('Presiona')} ${chalk.white.bold('Ctrl+C')} ${chalk.gray('para detener')}                              │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
`;
    
    this.logger.info(banner);
  }

  public printRoutes(): void {
    // Extraer y mostrar las rutas registradas de manera segura
    const routes: Record<string, Array<{ method: string, path: string }>> = {};
    
    // Acceder a las rutas de manera segura
    if (this.router && Array.isArray(this.router.stack)) {
      this.router.stack.forEach((layer: any) => {
        if (layer.route) {
          const path = layer.route.path;
          // Obtener métodos de forma segura
          const methods: string[] = [];
          
          // Usar una aserción de tipo para acceder a las propiedades internas de Express
          const routeMethods = (layer.route as any)?.methods;
          
          if (routeMethods && typeof routeMethods === 'object') {
            Object.keys(routeMethods)
              .filter((method) => routeMethods[method] === true)
              .forEach((method) => methods.push(method.toUpperCase()));
          }
          
          if (methods.length > 0) {
            const prefix = this.getRoutePrefix(path);
            if (!routes[prefix]) {
              routes[prefix] = [];
            }
            
            methods.forEach((method) => {
              routes[prefix].push({
                method,
                path: path.replace(prefix, '') || '/',
              });
            });
          }
        }
      });
    }
    
    this.logger.info('\n📋 Rutas registradas:');
    
    Object.keys(routes).forEach((prefix) => {
      this.logger.info(`\n${prefix}:`);
      routes[prefix].forEach((route) => {
        this.logger.info(`  [${route.method.padEnd(6)}] ${route.path}`);
      });
    });
  }

  private getRoutePrefix(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts.length > 0 ? `/${parts[0]}` : '/';
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.app.listen().close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}