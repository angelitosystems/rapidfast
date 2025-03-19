import { Server } from './server';
import { RouteDefinition } from '../interfaces/controller.interface';
import { Logger } from '../utils/logger';
import { Type } from '../interfaces/type.interface';
import { ModuleMetadata } from '../interfaces/module.interface';
import { Config, SwaggerConfig } from '../interfaces/config.interface';
import 'reflect-metadata';
import { DependencyContainer } from './dependency.container';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export class RapidFastApplication {
  private server: Server;
  private logger: Logger;
  private modules: Type[] = [];
  private dependencyContainer: DependencyContainer;
  private config: Config = {};
  private envLastModified: number = 0;

  constructor() {
    this.server = new Server();
    this.logger = new Logger();
    this.dependencyContainer = new DependencyContainer();
    this.loadEnvironmentVariables();
    this.loadConfig();
  }

  /**
   * Carga las variables de entorno desde el archivo .env
   */
  private loadEnvironmentVariables(): void {
    const envPaths = [
      path.resolve(process.cwd(), '.env'),
      // También buscar variantes según el entorno actual
      path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
      // Permitir archivos .env.local que no se incluyan en el control de versiones
      path.resolve(process.cwd(), '.env.local')
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        try {
          const envStats = fs.statSync(envPath);
          this.envLastModified = Math.max(this.envLastModified, envStats.mtimeMs);
          
          dotenv.config({ path: envPath, override: true });
          this.logger.debug(`Variables de entorno cargadas desde ${path.basename(envPath)}`);
        } catch (error) {
          this.logger.warn(`Error al cargar variables de entorno desde ${envPath}:`, error);
        }
      }
    }
  }

  /**
   * Comprueba si las variables de entorno han cambiado y las recarga si es necesario
   * @returns true si se recargaron las variables, false si no hubo cambios
   */
  public checkAndReloadEnvIfChanged(): boolean {
    let reloaded = false;
    const envPaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
      path.resolve(process.cwd(), '.env.local')
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        try {
          const envStats = fs.statSync(envPath);
          if (envStats.mtimeMs > this.envLastModified) {
            // El archivo .env ha cambiado, recargar variables
            dotenv.config({ path: envPath, override: true });
            this.envLastModified = envStats.mtimeMs;
            this.logger.info(`🔄 Variables de entorno recargadas desde ${path.basename(envPath)}`);
            reloaded = true;
          }
        } catch (error) {
          this.logger.warn(`Error al verificar cambios en ${envPath}:`, error);
        }
      }
    }

    // Si se recargaron variables, también recargar la configuración
    if (reloaded) {
      this.loadConfig();
    }

    return reloaded;
  }

  /**
   * Carga la configuración desde archivos y variables de entorno
   */
  private loadConfig(): void {
    try {
      // Buscar configuración en varios formatos posibles con prioridad para TypeScript
      const configPaths = [
        path.resolve(process.cwd(), 'config/swagger.config.ts'),
        path.resolve(process.cwd(), 'src/config/swagger.config.ts'),
        path.resolve(process.cwd(), 'config/swagger.config.js'),
        path.resolve(process.cwd(), 'config/swagger.json'),
        path.resolve(process.cwd(), 'config/swagger.js')
      ];
      
      let swaggerConfig: SwaggerConfig | null = null;
      let configSource = '';
      
      // Buscar el primer archivo de configuración que exista
      for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
          try {
            if (configPath.endsWith('.json')) {
              swaggerConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              configSource = configPath;
              break;
            } else {
              // Es un archivo .js o .ts
              delete require.cache[require.resolve(configPath)];
              // Para archivos TypeScript, podemos tener un export default o módulo CommonJS
              const imported = require(configPath);
              swaggerConfig = imported.default || imported;
              configSource = configPath;
              break;
            }
          } catch (error) {
            this.logger.warn(`Error al cargar configuración desde ${configPath}:`, error);
          }
        }
      }
      
      // Configuración base (niveles más bajos de prioridad)
      this.config = {
        port: 3000,
        host: 'localhost',
        app: {
          name: 'RapidFAST Application',
          description: 'Application built with RapidFAST Framework',
          version: '1.0.0',
          environment: 'development'
        },
        swagger: {
          enabled: true,
          title: 'API Documentation',
          version: '1.0.0',
          description: 'API Documentation',
          routePrefix: '/api-docs'
        }
      };
      
      // Fusionar con la configuración cargada desde archivos (nivel medio de prioridad)
      if (swaggerConfig) {
        // Mostrar mensaje de carga con emoji y ruta del archivo
        const configFilename = path.basename(configSource);
        this.logger.info(`📄 Configuración cargada desde ${configFilename}`);

        this.config.swagger = {
          ...this.config.swagger,
          ...swaggerConfig
        };
      }

      // Sobrescribir con variables de entorno (nivel más alto de prioridad)
      this.config.port = process.env.PORT ? parseInt(process.env.PORT, 10) : this.config.port;
      this.config.host = process.env.HOST || this.config.host;
      
      // Configuración de la aplicación
      if (!this.config.app) this.config.app = {};
      this.config.app.name = process.env.APP_NAME || this.config.app.name;
      this.config.app.description = process.env.APP_DESCRIPTION || this.config.app.description;
      this.config.app.version = process.env.APP_VERSION || this.config.app.version;
      this.config.app.environment = process.env.NODE_ENV || this.config.app.environment;
      
      // Configuración de Swagger
      if (!this.config.swagger) this.config.swagger = {};
      this.config.swagger.enabled = process.env.SWAGGER_ENABLED !== 'false';
      this.config.swagger.title = process.env.SWAGGER_TITLE || process.env.APP_NAME || this.config.swagger.title;
      this.config.swagger.version = process.env.SWAGGER_VERSION || process.env.APP_VERSION || this.config.swagger.version;
      this.config.swagger.description = process.env.SWAGGER_DESCRIPTION || process.env.APP_DESCRIPTION || this.config.swagger.description;
      this.config.swagger.routePrefix = process.env.SWAGGER_ROUTE_PREFIX || this.config.swagger.routePrefix;
      
      // Opciones personalizadas de Swagger UI
      if (process.env.SWAGGER_CUSTOM_CSS) this.config.swagger.customCss = process.env.SWAGGER_CUSTOM_CSS;
      if (process.env.SWAGGER_CUSTOM_JS) this.config.swagger.customJs = process.env.SWAGGER_CUSTOM_JS;
      if (process.env.SWAGGER_SITE_TITLE) this.config.swagger.customSiteTitle = process.env.SWAGGER_SITE_TITLE;
      if (process.env.SWAGGER_URL) this.config.swagger.swaggerUrl = process.env.SWAGGER_URL;
      
      // Servidores de Swagger
      if (process.env.SWAGGER_SERVERS) {
        try {
          this.config.swagger.servers = JSON.parse(process.env.SWAGGER_SERVERS);
        } catch (error) {
          this.logger.warn('Error al parsear SWAGGER_SERVERS:', error);
        }
      }
      
    } catch (error) {
      this.logger.warn('Error al cargar la configuración:', error);
    }
  }

  /**
   * Registra un módulo en la aplicación
   * @param module Módulo a registrar
   * @deprecated Use initialize([module]) instead
   */
  public async register(module: Type): Promise<void> {
    this.modules.push(module);
    await this.initialize([module]);
    return;
  }

  public async initialize(modules: Type[]): Promise<void> {
    try {
      // Lista para almacenar las instancias de controladores
      const controllerInstances: any[] = [];
      
      // Función para procesar un módulo y sus importaciones recursivamente
      const processModule = async (module: Type, processedModules: Set<Type> = new Set()): Promise<void> => {
        // Evitar procesar el mismo módulo varias veces
        if (processedModules.has(module)) {
          return;
        }
        
        processedModules.add(module);
        
        const metadata: ModuleMetadata = Reflect.getMetadata('module', module) || {};
        
        // Registrar módulo si no está ya registrado
        if (!this.modules.includes(module)) {
          this.modules.push(module);
        }
        
        // Registrar providers (servicios)
        if (metadata.providers) {
          for (const provider of metadata.providers) {
            this.dependencyContainer.register(provider);
          }
        }
        
        // Registrar controladores
        if (metadata.controllers) {
          for (const controller of metadata.controllers) {
            const instance = this.dependencyContainer.resolve(controller);
            const prefix: string = Reflect.getMetadata('prefix', controller) || '';
            const routes: RouteDefinition[] = Reflect.getMetadata('routes', controller) || [];
            
            // Almacenar instancia de controlador
            controllerInstances.push(instance);
            
            // Registrar las rutas en el servidor con la instancia del controlador
            this.server.addRoutesWithController(prefix, routes, instance);
          }
        }
        
        // Procesar recursivamente los módulos importados
        if (metadata.imports && Array.isArray(metadata.imports)) {
          for (const importedModule of metadata.imports) {
            await processModule(importedModule, processedModules);
          }
        }
      };
      
      // Procesar todos los módulos iniciales
      const processedModules = new Set<Type>();
      for (const module of modules) {
        await processModule(module, processedModules);
      }
      
      // Configurar Swagger con los controladores instanciados y la configuración cargada
      const swaggerConfig = this.config.swagger || {};
      this.server.setupSwagger(swaggerConfig, controllerInstances);
      
    } catch (error) {
      this.logger.error('Error al inicializar la aplicación:', error);
      throw error;
    }
  }

  /**
   * Inicia el servidor en el puerto y host especificados
   * @param port Puerto en el que escuchar
   * @param host Host en el que escuchar (opcional)
   * @param callback Función a ejecutar cuando el servidor esté listo (opcional)
   */
  public listen(port: number, host?: string | (() => void), callback?: () => void): void {
    // Si el segundo parámetro es una función, es el callback
    if (typeof host === 'function') {
      callback = host;
      host = undefined;
    }
    
    // Usar valores de la configuración si no se especifican
    const listenPort = port || this.config.port || parseInt(process.env.PORT || '3000', 10);
    
    // El banner detallado ahora se mostrará solo desde Server.displayServerBanner
    // para evitar duplicación de mensajes
    
    const finalCallback = () => {
      if (callback) {
        callback();
      }
    };
    
    this.server.listen(listenPort, finalCallback);
  }

  public async close(): Promise<void> {
    await this.server.close();
  }
  
  /**
   * Obtiene la configuración actual de la aplicación
   */
  public getConfig(): Config {
    return this.config;
  }
}

// Exportar la clase también como Application para mantener compatibilidad
export { RapidFastApplication as Application };
