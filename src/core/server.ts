import express, { Express, Request, Response, NextFunction, Router } from 'express';
import { Logger } from '../utils/logger';
import { RouteDefinition } from '../interfaces/controller.interface';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import chalk from 'chalk';  // Añadimos esta importación
import path from 'path';
import fs from 'fs';

export class Server {
  private app: Express;
  private logger: Logger;
  private router: Router;

  public constructor() {
    this.app = express();
    this.router = express.Router();
    this.logger = new Logger();
    
    // Configurar middleware básico
    this.setupMiddleware();
    
    // Añadir rutas internas de sistema
    this.setupSystemRoutes();
    
    // Configurar Swagger UI
    this.setupSwaggerUI();
    
    // Establecer el enrutador principal
    this.app.use('/', this.router);  // Montar el router en la raíz
    
    // Añadir middleware de manejo de errores global al final
    this.setupErrorHandlers();
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

    // Logging en desarrollo con formato personalizado y alineado
    if (process.env.NODE_ENV === 'development') {
      // Middleware para registrar tiempo de respuesta
      this.app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - start;
          (res as any).locals = (res as any).locals || {};
          (res as any).locals.responseTime = duration;
        });
        next();
      });

      // Crear tokens personalizados para Morgan con formato mejorado
      // Token para método HTTP con color según el tipo
      morgan.token('method-colored', (req: any) => {
        const method = req.method?.toUpperCase() || 'UNKN';
        switch (method) {
          case 'GET':
            return chalk.bold.green(method.padEnd(7));
          case 'POST':
            return chalk.bold.yellow(method.padEnd(7));
          case 'PUT':
            return chalk.bold.blue(method.padEnd(7));
          case 'DELETE':
            return chalk.bold.red(method.padEnd(7));
          case 'PATCH':
            return chalk.bold.cyan(method.padEnd(7));
          case 'OPTIONS':
            return chalk.bold.gray(method.padEnd(7));
          default:
            return chalk.bold.white(method.padEnd(7));
        }
      });
      
      // Token para URL con truncamiento inteligente
      morgan.token('url-smart', (req: any) => {
        const url = req.originalUrl || req.url || '';
        // Si la URL es muy larga, mostrar el inicio y el final
        if (url.length > 30) {
          const start = url.substring(0, 15);
          const end = url.substring(url.length - 12);
          return chalk.white(`${start}...${end}`).padEnd(32);
        }
        return chalk.white(url.padEnd(30));
      });
      
      // Token para código de estado con color según el rango
      morgan.token('status-colored', (req: any, res: any) => {
        const status = res.statusCode || 0;
        let statusStr = status.toString().padStart(3);
        
        if (status >= 500) {
          return chalk.bold.red(statusStr);
        } else if (status >= 400) {
          return chalk.bold.yellow(statusStr);
        } else if (status >= 300) {
          return chalk.bold.cyan(statusStr);
        } else if (status >= 200) {
          return chalk.bold.green(statusStr);
        } else {
          return chalk.bold.gray(statusStr);
        }
      });
      
      // Token para tiempo de respuesta con color según la velocidad
      morgan.token('response-time-colored', (req: any, res: any) => {
        const duration = (res as any).locals?.responseTime || 0;
        const timeStr = duration.toFixed(2).padStart(7) + ' ms';
        
        if (duration < 10) {
          return chalk.green(timeStr);
        } else if (duration < 100) {
          return chalk.yellow(timeStr);
        } else if (duration < 1000) {
          return chalk.magenta(timeStr);
        } else {
          return chalk.red(timeStr);
        }
      });

      // Formato para la tabla de peticiones HTTP
      const format = `${chalk.gray('┃')} :method-colored ${chalk.gray('┃')} :url-smart ${chalk.gray('┃')} :status-colored ${chalk.gray('┃')} :response-time-colored ${chalk.gray('┃')}`;
      
      // Aplicar el middleware de Morgan con nuestro formato
      this.app.use(morgan(format));
    }

    // Servir archivos estáticos si existe la carpeta public
    const publicPath = path.join(process.cwd(), 'public');
    if (fs.existsSync(publicPath)) {
      this.app.use(express.static(publicPath));
      this.logger.info(`📂 Sirviendo archivos estáticos desde: ${publicPath}`);
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

  private setupSwaggerUI(): void {
    try {
      const swaggerConfig = require('../config/swagger.config').default;
      if (swaggerConfig.enabled !== false) {
        const swaggerUiOptions = {
          customCss: swaggerConfig.customCss || '',
          customSiteTitle: swaggerConfig.customSiteTitle || 'API Documentation'
        };
        
        const routePrefix = swaggerConfig.routePrefix || '/api-docs';
        this.app.use(routePrefix, swaggerUi.serve, swaggerUi.setup(null, swaggerUiOptions));
        this.logger.info(`📚 Swagger UI disponible en ${routePrefix}`);
      }
    } catch (error) {
      this.logger.warn('Error al configurar Swagger UI:', error);
    }
  }

  private setupSystemRoutes(): void {
    // Ruta interna para comprobar estado del servidor
    this.router.get('/_rapidfast/health', (req, res) => {
      res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
      });
    });
    
    // Endpoint para recargar variables de entorno sin reiniciar el servidor
    this.router.post('/_rapidfast/reload-env', (req, res) => {
      try {
        // Obtener referencia a la aplicación principal
        const app = require.main?.exports?.app;
        
        if (!app || typeof app.checkAndReloadEnvIfChanged !== 'function') {
          return res.status(501).json({
            success: false,
            message: 'La aplicación no admite recarga de variables de entorno'
          });
        }
        
        // Intentar recargar las variables de entorno
        const reloaded = app.checkAndReloadEnvIfChanged();
        
        if (reloaded) {
          // Si se recargaron las variables, notificar éxito
          this.logger.info('🔄 Variables de entorno recargadas sin reinicio del servidor');
          return res.json({
            success: true,
            message: 'Variables de entorno recargadas con éxito',
            variables: Object.keys(process.env).filter(key => 
              // Solo incluir variables relevantes para la aplicación
              key.startsWith('APP_') || 
              key.startsWith('SWAGGER_') || 
              ['NODE_ENV', 'PORT', 'HOST'].includes(key)
            )
          });
        } else {
          // No se encontraron cambios
          return res.json({
            success: false,
            message: 'No se detectaron cambios en las variables de entorno'
          });
        }
      } catch (error) {
        this.logger.error('Error al recargar variables de entorno:', error);
        return res.status(500).json({
          success: false,
          message: 'Error al recargar variables de entorno',
          error: error instanceof Error ? error.message : String(error)
        });
      }
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
    // Asegurar que tenemos alguna ruta para procesar
    if (!routes || routes.length === 0) {
      this.logger.warn(`Controlador sin rutas: ${controller.constructor.name}`);
      return;
    }
    
    // this.logger.info(`Registrando rutas para controlador: ${controller.constructor.name} con prefijo '${prefix || '/'}'`);
    
    for (const route of routes) {
      const { method, path, methodName, middleware = [] } = route;
      const routePath = this.normalizePath(prefix, path);
      
      // Verificar que el método exista en el controlador
      if (!controller[methodName]) {
        this.logger.error(`⚠️ Método '${methodName}' no encontrado en controlador ${controller.constructor.name}`);
        continue;
      }
      
      // Verificar que el método sea una función
      if (typeof controller[methodName] !== 'function') {
        this.logger.error(`⚠️ '${methodName}' no es una función en el controlador ${controller.constructor.name}`);
        continue;
      }
      
      // Vincular el handler al controlador
      const handler = controller[methodName].bind(controller);
      
      // Asignar el controlador a la definición de ruta (para Swagger)
      route.controller = controller;
      
      // Registrar la ruta con el método adecuado
      this.registerRouteHandler(method, routePath, middleware, handler);
      
      // // Log detallado de la ruta registrada
      // this.logger.info(`✅ Ruta registrada: [${method.toUpperCase().padEnd(6)}] ${routePath} -> ${controller.constructor.name}.${methodName}()`);
    }
  }

  // Método auxiliar para registrar rutas según el verbo HTTP
  private registerRouteHandler(
    method: string, 
    path: string, 
    middleware: any[], 
    handler: any
  ): void {
    const methodHandlers: Record<string, (path: string, ...handlers: any[]) => void> = {
      'get': this.router.get.bind(this.router),
      'post': this.router.post.bind(this.router),
      'put': this.router.put.bind(this.router),
      'delete': this.router.delete.bind(this.router),
      'patch': this.router.patch.bind(this.router),
      'options': this.router.options.bind(this.router),
      'head': this.router.head.bind(this.router)
    };
    
    const methodLower = method.toLowerCase();
    
    if (methodHandlers[methodLower]) {
      // Crear un wrapper para el handler que maneja correctamente las promesas y excepciones
      const wrappedHandler = async (req: Request, res: Response, next: NextFunction) => {
        try {
          this.logger.debug(`Ejecutando ruta ${methodLower.toUpperCase()} ${path}`);
          
          // Ejecutar el handler original
          const result = await handler(req, res, next);
          
          // Si ya se ha enviado una respuesta, no hacer nada más
          if (res.headersSent) {
            this.logger.debug(`Respuesta ya enviada en ${methodLower.toUpperCase()} ${path}`);
            return;
          }
          
          // Si el resultado es undefined, asumir que next() se llamará manualmente
          if (result === undefined) {
            this.logger.debug(`Handler de ${methodLower.toUpperCase()} ${path} no devolvió resultado, esperando next() manual`);
            return;
          }
          
          // Si hay un resultado, enviarlo como JSON (comportamiento por defecto)
          this.logger.debug(`Enviando resultado JSON para ${methodLower.toUpperCase()} ${path}`);
          return res.json(result);
        } catch (error) {
          this.logger.error(`Error en ruta ${methodLower.toUpperCase()} ${path}:`, error);
          // Pasar la excepción al middleware de manejo de errores
          return next(error);
        }
      };
      
      // Registrar la ruta con el wrapper y los middleware
      methodHandlers[methodLower](path, ...middleware, wrappedHandler);
      this.logger.debug(`Ruta registrada: [${methodLower.toUpperCase().padEnd(6)}] ${path}`);
    } else {
      this.logger.warn(`Método HTTP no soportado: ${method}`);
    }
  }

  private normalizePath(prefix: string, path: string): string {
    // Asegurarse de que el path comience con /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const normalizedPrefix = prefix ? (prefix.startsWith('/') ? prefix : `/${prefix}`) : '';
    
    return `${normalizedPrefix}${normalizedPath}`;
  }

  /**
   * Configura Swagger para la aplicación
   * 
   * La configuración de Swagger se puede definir de varias formas:
   * 
   * 1. Mediante un archivo de configuración:
   *    - config/swagger.config.ts (preferido)
   *    - src/config/swagger.config.ts
   *    - config/swagger.config.js
   *    - config/swagger.json
   * 
   * 2. Mediante variables de entorno:
   *    - SWAGGER_TITLE: Título de la documentación
   *    - SWAGGER_DESCRIPTION: Descripción de la API
   *    - SWAGGER_VERSION: Versión de la API
   *    - SWAGGER_ROUTE_PREFIX: Ruta para acceder a Swagger UI (por defecto: /api-docs)
   *    - SWAGGER_ENABLED: Habilitar/deshabilitar Swagger (true/false)
   * 
   * 3. A través de los decoradores en los controladores:
   *    ```typescript
   *    @Controller({
   *      prefix: '/usuarios',
   *      tags: ['Usuarios'],
   *      description: 'API para gestionar usuarios'
   *    })
   *    export class UsuarioController {
   *      // ...
   *    }
   *    ```
   * 
   * @param swaggerConfig Configuración de Swagger
   * @param controllers Controladores para documentar
   */
  public setupSwagger(options: any, controllers?: any[]): void {
    // Cargar configuración desde un archivo TypeScript si existe
    let swaggerConfig: any = {};
    
    try {
      // Intentar cargar desde el directorio config del proyecto
      const configPath = path.resolve(process.cwd(), 'config', 'swagger.config.ts');
      if (fs.existsSync(configPath)) {
        // Importar usando require para compatibilidad con ts-node y JavaScript
        swaggerConfig = require(configPath).default || require(configPath);
        this.logger.info('ℹ️ Configuración de Swagger cargada desde archivo');
      }
    } catch (error) {
      this.logger.debug('No se encontró archivo de configuración para Swagger');
    }
    
    // Valores por defecto con prioridad para variables de entorno
    const swaggerDocument = {
      openapi: '3.0.0',
      info: {
        title: process.env.SWAGGER_TITLE || process.env.APP_NAME || swaggerConfig.title || options.title || 'RapidFAST API',
        description: process.env.APP_DESCRIPTION || swaggerConfig.description || options.description || 'API Documentation',
        version: process.env.APP_VERSION || swaggerConfig.version || options.version || '1.0.0',
      },
      servers: process.env.SWAGGER_SERVERS ? JSON.parse(process.env.SWAGGER_SERVERS) :
               swaggerConfig.servers || options.servers || [
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

    // Configuración para Swagger UI con prioridad para variables de entorno
    const swaggerUiOptions: any = {
      explorer: process.env.SWAGGER_EXPLORER === 'true' || swaggerConfig.explorer || options.explorer || true
    };
    
    // Aplicar opciones personalizadas con prioridad para variables de entorno
    if (process.env.SWAGGER_CUSTOM_CSS || swaggerConfig.customCss || options.customCss) {
      swaggerUiOptions.customCss = process.env.SWAGGER_CUSTOM_CSS || swaggerConfig.customCss || options.customCss;
    }
    
    if (process.env.SWAGGER_CUSTOM_JS || swaggerConfig.customJs || options.customJs) {
      swaggerUiOptions.customJs = process.env.SWAGGER_CUSTOM_JS || swaggerConfig.customJs || options.customJs;
    }
    
    if (process.env.SWAGGER_SITE_TITLE || swaggerConfig.customSiteTitle || options.customSiteTitle) {
      swaggerUiOptions.customSiteTitle = process.env.SWAGGER_SITE_TITLE || swaggerConfig.customSiteTitle || options.customSiteTitle;
    }
    
    if (process.env.SWAGGER_URL || swaggerConfig.swaggerUrl || options.swaggerUrl) {
      swaggerUiOptions.swaggerUrl = process.env.SWAGGER_URL || swaggerConfig.swaggerUrl || options.swaggerUrl;
    }
    
    // Determinar la ruta de la documentación Swagger
    const routePrefix = process.env.SWAGGER_ROUTE_PREFIX || swaggerConfig.routePrefix || options.routePrefix || '/api-docs';

    // Generar rutas para Swagger
    this.router.use(routePrefix, swaggerUi.serve);
    this.router.get(routePrefix, swaggerUi.setup(swaggerDocument, swaggerUiOptions));
    
    // Endpoint para el archivo JSON de Swagger
    this.router.get('/swagger.json', (req, res) => {
      res.json(swaggerDocument);
    });
    
    // Registrar las rutas en el log con emojis alineados
    this.logger.info(`📚 Swagger UI disponible en ${routePrefix}`);
    this.logger.info(`📋 Swagger JSON disponible en /swagger.json`);
  }
  
  /**
   * Procesa los controladores para generar documentación Swagger
   */
  private processControllersForSwagger(swaggerDocument: any, controllers: any[]): void {
    // Buscar y registrar todos los tags antes de procesar los endpoints
    this.collectSwaggerTags(swaggerDocument, controllers);
    
    for (const controller of controllers) {
      // Extraer metadatos del controlador
      const prefix = Reflect.getMetadata('prefix', controller.constructor) || '';
      const routes = Reflect.getMetadata('routes', controller.constructor) || [];
      
      // Obtener tags del controlador (nueva forma desde el decorador)
      const controllerTags = Reflect.getMetadata('swagger:tags', controller.constructor) || [];
      
      // Obtener documentación API desde el decorador ApiDoc (compatibilidad)
      const apiDoc = Reflect.getMetadata('swagger:api', controller.constructor);
      
      // Combinar tags de ambas fuentes (manteniendo compatibilidad)
      const tags = [...controllerTags];
      if (apiDoc && apiDoc.tags) {
        const docTags = Array.isArray(apiDoc.tags) ? apiDoc.tags : [apiDoc.tags];
        docTags.forEach((tag: string) => {
          if (!tags.includes(tag)) {
            tags.push(tag);
          }
        });
      }
      
      // Si no hay tags, usar el nombre de la clase como tag por defecto
      if (tags.length === 0) {
        const className = controller.constructor.name;
        // Eliminar sufijo 'Controller' si existe
        const tagName = className.endsWith('Controller') 
          ? className.substring(0, className.length - 10) 
          : className;
        tags.push(tagName);
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
        const methodDoc: any = {
          summary: `${methodName}`,
          description: '',
          parameters: [],
          responses: {}
        };
        
        // Asignar tags del controlador a la ruta
        methodDoc.tags = [...tags];
        
        // Procesar parámetros desde el decorador ApiParam
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
        
        // Procesar cuerpo desde el decorador ApiBody
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
        
        // Procesar respuestas desde el decorador ApiResponse
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
        
        // Si no hay respuestas definidas, añadir una respuesta genérica 200
        if (Object.keys(methodDoc.responses).length === 0) {
          methodDoc.responses['200'] = {
            description: 'Successful operation'
          };
        }
        
        // Añadir método al path
        swaggerDocument.paths[fullPath][method.toLowerCase()] = methodDoc;
      }
    }
  }
  
  /**
   * Recopila y registra tags de Swagger de todos los controladores
   */
  private collectSwaggerTags(swaggerDocument: any, controllers: any[]): void {
    // Mapa para evitar duplicados de tags
    const tagMap = new Map<string, { name: string; description: string }>();
    
    // Procesar cada controlador
    for (const controller of controllers) {
      // Obtener tags del controlador (nueva forma)
      const controllerTags = Reflect.getMetadata('swagger:tags', controller.constructor) || [];
      
      // Obtener metadata API antigua (para compatibilidad)
      const apiDoc = Reflect.getMetadata('swagger:api', controller.constructor);
      
      // Procesar y combinar tags
      if (controllerTags.length > 0) {
        for (const tagName of controllerTags) {
          if (!tagMap.has(tagName)) {
            const className = controller.constructor.name;
            const description = apiDoc?.description || `API endpoints de ${className}`;
            tagMap.set(tagName, { name: tagName, description });
          }
        }
      } else if (apiDoc && apiDoc.tags) {
        // Compatibilidad con formato antiguo
        const tags = Array.isArray(apiDoc.tags) ? apiDoc.tags : [apiDoc.tags];
        for (const tagName of tags) {
          if (!tagMap.has(tagName)) {
            tagMap.set(tagName, { 
              name: tagName, 
              description: apiDoc.description || `API endpoints de ${tagName}`
            });
          }
        }
      } else {
        // Sin tags definidos, usar nombre de la clase
        const className = controller.constructor.name;
        // Eliminar sufijo 'Controller' si existe
        const tagName = className.endsWith('Controller') 
          ? className.substring(0, className.length - 10) 
          : className;
          
        if (!tagMap.has(tagName)) {
          tagMap.set(tagName, { 
            name: tagName, 
            description: `API endpoints de ${tagName}` 
          });
        }
      }
    }
    
    // Añadir los tags recopilados al documento
    swaggerDocument.tags = Array.from(tagMap.values());
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

  private displayServerBanner(port: number): void {
    const mode = process.env.NODE_ENV || 'desarrollo';
    const watchStatus = process.env.WATCH !== 'false' ? 'activado' : 'desactivado';
    const appName = process.env.APP_NAME || 'RapidFAST';
    const version = require('../../package.json').version;
    
    // Banner con bordes consistentes y alineación perfecta
    const createLine = (char: string) => chalk.bold.blue(char.repeat(73));
    const createRow = (content: string) => chalk.bold.blue('║') + content.padEnd(71) + chalk.bold.blue('║');
    
    const banner = `
${createLine('═')}
${createRow(`                ${chalk.bold.cyan('🚀 ')}${chalk.bold.magenta(appName)} ${chalk.bold.cyan('Framework')} ${chalk.gray(`v${version}`)}`)}
${createLine('═')}
${createRow(`  ${chalk.bold.white('▸ Local:          ')} ${chalk.green(`http://localhost:${port}`)}`)}
${createRow(`  ${chalk.bold.white('▸ Swagger UI:     ')} ${chalk.green(`http://localhost:${port}/api-docs`)}`)}
${createRow(`  ${chalk.bold.white('▸ Swagger JSON:   ')} ${chalk.green(`http://localhost:${port}/swagger.json`)}`)}
${createRow(`  ${chalk.bold.white('▸ Modo:           ')} ${chalk.yellow(mode)}`)}
${createRow(`  ${chalk.bold.white('▸ RapidWatch™:    ')} ${watchStatus === 'activado' ? chalk.green(watchStatus) : chalk.red(watchStatus)}`)}
${createLine('═')}

${chalk.gray('Presiona')} ${chalk.white.bold('Ctrl+C')} ${chalk.gray('para detener el servidor')}
`;
    
    this.logger.info(banner);
    
   
    // Configurar el encabezado de la tabla HTTP para peticiones
    const separator = chalk.gray('┏━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━┳━━━━━━━━━━━━━┓');
    const header = `${chalk.gray('┃')} ${chalk.bold.white('MÉTODO   ')} ${chalk.gray('┃')} ${chalk.bold.white('URL                           ')} ${chalk.gray('┃')} ${chalk.bold.white('COD')} ${chalk.gray('┃')} ${chalk.bold.white('TIEMPO      ')} ${chalk.gray('┃')}`;
    const separatorBottom = chalk.gray('┣━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━╋━━━━━━━━━━━━━┫');
    
    console.log('\n' + separator);
    console.log(header);
    console.log(separatorBottom);
    
    // Resetear el estado para la tabla HTTP
    (global as any).firstRequestLogged = true;
    (global as any).httpRequestCount = 0;
  }

  public printRoutes(): void {
    // Sólo mostrar las rutas en modo debug y cuando no estamos en modo CLI
    if (process.env.LOG_LEVEL !== 'DEBUG' && process.env.RAPIDFAST_CLI === 'true') {
      return; // No imprimir rutas en modo normal con CLI
    }
    
    // Extraer y mostrar las rutas registradas de manera segura
    const routes: Record<string, Array<{ method: string, path: string }>> = {};
    
    // Acceder a las rutas de manera segura
    if (this.router && Array.isArray(this.router.stack)) {
      this.router.stack.forEach((layer: any) => {
        if (layer.route) {
          const path = layer.route.path;
          // Obtener métodos de forma segura
          const methods = layer.route.methods ? 
            Object.keys(layer.route.methods).filter(m => layer.route.methods[m]) : 
            ['get'];
          
          const prefix = this.getRoutePrefix(path);
          
          if (!routes[prefix]) {
            routes[prefix] = [];
          }
          
          methods.forEach(method => {
            routes[prefix].push({
              method: method.toUpperCase(),
              path
            });
          });
        }
      });
      
      // Mostrar rutas organizadas por categoría usando un estilo de tabla
      console.log('\n' + chalk.bold.cyan('╔═══════════════════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║') + chalk.bold.white(' 📋 RUTAS REGISTRADAS                                      ') + chalk.bold.cyan('║'));
      console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════════╝'));
      
      Object.keys(routes).sort().forEach(prefix => {
        console.log('\n' + chalk.bold.cyan(`┌─────────────────── ${chalk.white(prefix || '/')} ───────────────────┐`));
        
        // Ordenar rutas para una mejor presentación
        routes[prefix].sort((a, b) => a.path.localeCompare(b.path)).forEach(route => {
          // Colorear método según tipo
          let methodColored;
          switch (route.method) {
            case 'GET':
              methodColored = chalk.bold.green(route.method.padEnd(6));
              break;
            case 'POST':
              methodColored = chalk.bold.yellow(route.method.padEnd(6));
              break;
            case 'PUT':
              methodColored = chalk.bold.blue(route.method.padEnd(6));
              break;
            case 'DELETE':
              methodColored = chalk.bold.red(route.method.padEnd(6));
              break;
            default:
              methodColored = chalk.bold.white(route.method.padEnd(6));
          }
          
          console.log(chalk.cyan('│') + ` ${methodColored} ${chalk.white(route.path)}`);
        });
        
        console.log(chalk.bold.cyan('└───────────────────────────────────────────────────────┘'));
      });
      
      console.log(); // Línea extra al final para mejor separación
    }
  }

  // Método para imprimir un footer en la tabla HTTP
  public printHttpFooter(): void {
    if ((global as any).httpRequestCount > 0) {
      const footer = chalk.gray('┗━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━┻━━━━━━━━━━━━━┛');
      console.log(footer);
      console.log(chalk.gray(`Total: ${(global as any).httpRequestCount} peticiones HTTP procesadas\n`));
    }
  }

  // Extraer el prefijo de una ruta para organizar las rutas por grupos
  private getRoutePrefix(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts.length > 0 ? parts[0] : '/';
  }

  public listen(port: number, callback?: () => void): any {
    try {
      const actualPort = port || parseInt(process.env.PORT || '3000', 10);
      const server = this.app.listen(actualPort, () => {
        // Registrar un manejador para cerrar la tabla HTTP cuando se cierre el servidor
        process.on('SIGINT', () => {
          this.printHttpFooter();
          process.exit(0);
        });
        
        // Incrementar contador de peticiones HTTP
        this.app.use((req, res, next) => {
          (global as any).httpRequestCount = ((global as any).httpRequestCount || 0) + 1;
          next();
        });
        
        // Mostrar el banner bonito
        this.displayServerBanner(actualPort);
        
        // Ejecutar el callback si se proporciona
        if (callback) callback();
      });
      
      return server;
    } catch (error) {
      this.logger.error('Error al iniciar el servidor:', error);
      throw error;
    }
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.app.listen().close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Configura el manejo de errores para la aplicación
   * @private
   */
  private setupErrorHandlers(): void {
    // Manejador para rutas no encontradas (404)
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (!res.headersSent) {
        this.logger.debug(`Ruta no encontrada: ${req.method} ${req.url}`);
        res.status(404).json({
          success: false,
          message: `Ruta no encontrada: ${req.method} ${req.url}`,
          statusCode: 404
        });
      }
    });
    
    // Manejador de errores global (debe tener 4 argumentos)
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Error interno del servidor';
      
      this.logger.error(`Error en ruta ${req.method} ${req.url}:`, err);
      
      if (!res.headersSent) {
        res.status(statusCode).json({
          success: false,
          message,
          statusCode,
          error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    });
  }
}