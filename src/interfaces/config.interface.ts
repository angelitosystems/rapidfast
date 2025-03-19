export interface SwaggerConfig {
  enabled?: boolean;
  title?: string;
  version?: string;
  description?: string;
  basePath?: string;
  schemes?: string[];
  customCss?: string;
  customJs?: string;
  customSiteTitle?: string;
  swaggerUrl?: string;
  routePrefix?: string;
  servers?: Array<{
    url: string;
    description?: string;
  }>;
}

export interface AppConfig {
  name?: string;
  description?: string;
  version?: string;
  environment?: string;
  baseUrl?: string;
}

export interface Config {
  port?: number;
  host?: string;
  app?: AppConfig;
  swagger?: SwaggerConfig;
  database?: {
    type?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    synchronize?: boolean;
    logging?: boolean;
  };
} 