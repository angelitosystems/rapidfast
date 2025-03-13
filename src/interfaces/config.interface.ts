export interface SwaggerConfig {
  enabled?: boolean;
  title?: string;
  version?: string;
  description?: string;
}

export interface Config {
  port?: number;
  swagger?: SwaggerConfig;
} 