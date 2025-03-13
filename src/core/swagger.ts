import swaggerJSDoc, { SwaggerDefinition } from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';
import { Request, Response, NextFunction } from '../interfaces/http.interface';
import { Logger } from '../utils/logger';
import { RouteDefinition, ControllerMetadata, RouteHandler } from '../interfaces/controller.interface';
import { RequestHandler } from 'express';

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

export interface SwaggerOptions {
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

export interface SwaggerMiddleware {
  serve: any[];
  setup: any;
}

export class SwaggerManager {
  private logger: Logger;
  private swaggerSpec: SwaggerDefinition;

  constructor() {
    this.logger = new Logger();
    this.swaggerSpec = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0'
      },
      paths: {}
    };
  }

  /**
   * Inicializa la documentación Swagger
   * @param options Opciones de Swagger
   */
  public async initialize(options: SwaggerOptions): Promise<void> {
    this.swaggerSpec = {
      openapi: '3.0.0',
      info: options.info,
      servers: options.servers,
      paths: {}
    };
  }

  /**
   * Obtiene el middleware para servir la documentación Swagger
   */
  public getMiddleware(): { serve: RequestHandler[]; setup: RequestHandler } {
    return {
      serve: swaggerUi.serve,
      setup: swaggerUi.setup(this.swaggerSpec)
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
} 