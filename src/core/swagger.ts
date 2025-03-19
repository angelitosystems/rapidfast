import swaggerJSDoc, { SwaggerDefinition, OAS3Definition, Information } from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';
import { Request, Response, NextFunction } from '../interfaces/http.interface';
import { Logger } from '../utils/logger';
import { RouteDefinition, ControllerMetadata, RouteHandler } from '../interfaces/controller.interface';
import { RequestHandler, Application } from 'express';
import { SwaggerConfig } from '../interfaces/config.interface';
import path from 'path';
import fs from 'fs';
import { SwaggerOptions } from '../interfaces/swagger.interface';

// Crear instancia del logger
const logger = new Logger();

export interface SwaggerInfo {
  title: string;
  version: string;
  description: string;
}

export interface SwaggerServer {
  url: string;
  description: string;
}

export interface SwaggerDefinitionCustom {
  openapi: string;
  info: SwaggerInfo;
  servers?: SwaggerServer[];
  paths: Record<string, any>;
}

export class SwaggerManager {
  private logger: Logger;
  private swaggerSpec: SwaggerDefinition;
  private options: SwaggerOptions;

  constructor() {
    this.logger = new Logger();
    this.options = {
      info: {
        title: process.env.APP_NAME || 'API Documentation',
        version: process.env.APP_VERSION || '1.0.0',
        description: process.env.APP_DESCRIPTION || 'API generada con RapidFAST Framework'
      }
    };
    this.swaggerSpec = {
      openapi: '3.0.0',
      info: {
        title: this.options.info?.title || 'API Documentation',
        version: this.options.info?.version || '1.0.0',
        description: this.options.info?.description || 'API Documentation'
      },
      paths: {}
    };
  }

  /**
   * Inicializa la documentación Swagger
   * @param options Opciones de Swagger
   */
  public async initialize(options: SwaggerOptions | SwaggerConfig): Promise<void> {
    // Fusionar opciones predeterminadas con las proporcionadas
    this.options = this.mergeOptions(options);
    
    // Inicializar la especificación de Swagger
    this.swaggerSpec = {
      openapi: '3.0.0',
      info: {
        title: this.options.info?.title || 'API Documentation',
        version: this.options.info?.version || '1.0.0',
        description: this.options.info?.description || 'API Documentation'
      },
      servers: this.options.servers,
      paths: {}
    };
  }

  /**
   * Fusiona las opciones proporcionadas con las predeterminadas
   */
  private mergeOptions(options: SwaggerOptions | SwaggerConfig): SwaggerOptions {
    const defaultOptions: SwaggerOptions = {
      info: {
        title: process.env.APP_NAME || 'API Documentation',
        version: process.env.APP_VERSION || '1.0.0',
        description: process.env.APP_DESCRIPTION || 'API generada con RapidFAST Framework'
      },
      routePrefix: process.env.SWAGGER_ROUTE_PREFIX || '/api-docs'
    };

    // Determinar el formato de las opciones y fusionarlas
    if ('enabled' in options) {
      // Es SwaggerConfig (desde config.interface.ts)
      const swaggerConfig = options as SwaggerConfig;
      
      // Asegurarse de que los servidores tengan una descripción definida
      const processedServers = swaggerConfig.servers?.map(server => ({
        url: server.url,
        description: server.description || 'Server'
      }));
      
      return {
        ...defaultOptions,
        info: {
          ...defaultOptions.info!,
          title: swaggerConfig.title || defaultOptions.info!.title,
          version: swaggerConfig.version || defaultOptions.info!.version,
          description: swaggerConfig.description || defaultOptions.info!.description
        },
        servers: processedServers,
        basePath: swaggerConfig.basePath || defaultOptions.basePath,
        schemes: swaggerConfig.schemes || defaultOptions.schemes,
        customCss: swaggerConfig.customCss || defaultOptions.customCss,
        customJs: swaggerConfig.customJs || defaultOptions.customJs,
        customSiteTitle: swaggerConfig.customSiteTitle || defaultOptions.customSiteTitle,
        swaggerUrl: swaggerConfig.swaggerUrl || defaultOptions.swaggerUrl,
        routePrefix: swaggerConfig.routePrefix || defaultOptions.routePrefix
      };
    } else {
      // Es SwaggerOptions (desde este archivo)
      const swaggerOptions = options as SwaggerOptions;
      
      // Asegurarnos de que info tenga valores predeterminados para las propiedades requeridas
      const mergedInfo = {
        ...defaultOptions.info!,
        ...(swaggerOptions.info || {}),
        title: swaggerOptions.info?.title || defaultOptions.info!.title,
        version: swaggerOptions.info?.version || defaultOptions.info!.version
      };
      
      // Asegurarse de que los servidores tengan una descripción definida
      const processedServers = swaggerOptions.servers?.map(server => ({
        url: server.url,
        description: server.description || 'Server'
      }));
      
      return {
        ...defaultOptions,
        ...swaggerOptions,
        info: mergedInfo,
        servers: processedServers
      };
    }
  }

  /**
   * Obtiene el middleware para servir la documentación Swagger
   */
  public getMiddleware(): { serve: RequestHandler[]; setup: RequestHandler; options: any } {
    const setupOptions: any = {};
    
    // Configurar opciones adicionales para Swagger UI
    if (this.options.customCss) setupOptions.customCss = this.options.customCss;
    if (this.options.customJs) setupOptions.customJs = this.options.customJs;
    if (this.options.customSiteTitle) setupOptions.customSiteTitle = this.options.customSiteTitle;
    if (this.options.swaggerUrl) setupOptions.swaggerUrl = this.options.swaggerUrl;
    
    return {
      serve: swaggerUi.serve,
      setup: swaggerUi.setup(this.swaggerSpec, setupOptions),
      options: this.options
    };
  }

  /**
   * Obtiene el middleware para servir el JSON de Swagger
   */
  public getSpecMiddleware(): RouteHandler {
    return (req: Request, res: Response) => {
      res.json(this.swaggerSpec);
    };
  }

  public getSpec(): SwaggerDefinition {
    return this.swaggerSpec;
  }
  
  public getOptions(): SwaggerOptions {
    return this.options;
  }

  /**
   * Configura Swagger para la aplicación
   */
  static setupSwagger(app: Application, swaggerOptions: SwaggerOptions): void {
    if (!swaggerOptions.enabled) {
      logger.info('Swagger desactivado');
      return;
    }
    
    // Asegurarse de que los servidores tengan una descripción definida
    const processedServers = swaggerOptions.servers?.map(server => ({
      url: server.url,
      description: server.description || 'Server'
    })) || [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server'
      }
    ];

    // Generar especificación OpenAPI
    const swaggerSpec = swaggerJSDoc({
      swaggerDefinition: {
        openapi: '3.0.0',
        info: {
          title: swaggerOptions.title || 'API Documentation',
          version: swaggerOptions.version || '1.0.0',
          description: swaggerOptions.description || 'API Documentation'
        },
        servers: processedServers,
        components: {
          securitySchemes: swaggerOptions.security || {},
          schemas: swaggerOptions.schemas || {}
        },
        security: this.setupSecurityConfig(swaggerOptions)
      },
      apis: swaggerOptions.routeFiles || [
        './src/controllers/**/*.ts',
        './src/controllers/**/*.js'
      ]
    });

    // Rutas para la documentación Swagger
    app.use(
      swaggerOptions.path || '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: swaggerOptions.customCss || '',
        customJs: swaggerOptions.customJs || '',
        swaggerOptions: {
          persistAuthorization: true
        }
      })
    );

    // Ruta para el archivo JSON de Swagger
    app.get('/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    logger.info(`Swagger habilitado en ${swaggerOptions.path || '/api-docs'}`);
  }

  /**
   * Carga la configuración de Swagger desde un archivo
   */
  static useSwaggerConfig(customConfigPath?: string): SwaggerOptions {
    // Intentar cargar la configuración desde un archivo
    try {
      // Intentar primero con archivo TypeScript
      const configPath = customConfigPath || path.resolve(process.cwd(), 'src/config/swagger.config.ts');
      const tsConfigPath = configPath.endsWith('.ts') ? configPath : `${configPath}.ts`;
      
      if (fs.existsSync(tsConfigPath)) {
        // Importar y usar el archivo TypeScript de configuración
        const swaggerConfig = require(tsConfigPath);
        return typeof swaggerConfig.default === 'object' 
          ? swaggerConfig.default 
          : swaggerConfig;
      }
      
      // Si no hay archivo TS, buscar JS
      const jsConfigPath = configPath.replace(/\.ts$/, '.js');
      if (fs.existsSync(jsConfigPath)) {
        // Importar y usar el archivo JS de configuración
        const swaggerConfig = require(jsConfigPath);
        return typeof swaggerConfig.default === 'object' 
          ? swaggerConfig.default 
          : swaggerConfig;
      }
    } catch (error: any) {
      logger.warn(`No se pudo cargar la configuración personalizada de Swagger: ${error.message}`);
    }

    // Configuración por defecto si no se encuentra ningún archivo
    return {
      enabled: true,
      title: 'RapidFast API',
      version: '1.0.0',
      description: 'Documentación de la API generada con RapidFast',
      path: '/api-docs',
      tags: [],
      security: {},
      schemas: {},
      info: {
        title: 'RapidFast API',
        version: '1.0.0',
        description: 'Documentación de la API generada con RapidFast'
      }
    };
  }

  /**
   * Configura seguridad global para todos los endpoints
   */
  private static setupSecurityConfig(options: SwaggerOptions): any[] {
    // Si no hay configuración de seguridad, devolver array vacío
    if (!options.security || Object.keys(options.security).length === 0) {
      return [];
    }

    // Si ya está configurado como array, devolverlo directamente
    if (Array.isArray(options.globalSecurity)) {
      return options.globalSecurity;
    }

    // Si hay esquemas de seguridad pero no configuración global,
    // crear una configuración que los incluya todos
    return Object.keys(options.security).map(key => {
      const securityItem: Record<string, any> = {};
      securityItem[key] = [];
      return securityItem;
    });
  }
} 