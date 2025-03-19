/**
 * Opciones de configuración para Swagger
 */
export interface SwaggerOptions {
  /** Si Swagger está habilitado */
  enabled?: boolean;
  /** Título de la documentación */
  title?: string;
  /** Versión de la API */
  version?: string;
  /** Descripción de la API */
  description?: string;
  /** Ruta de acceso a la documentación */
  path?: string;
  /** Archivos de rutas a escanear */
  routeFiles?: string[];
  /** Etiquetas globales */
  tags?: { name: string; description: string }[];
  /** Esquemas de seguridad */
  security?: Record<string, any>;
  /** Esquemas de componentes */
  schemas?: Record<string, any>;
  /** Configuración de seguridad global */
  globalSecurity?: any[];
  /** Servidores disponibles */
  servers?: { url: string; description: string }[];
  /** CSS personalizado */
  customCss?: string;
  /** JavaScript personalizado */
  customJs?: string;
  /** Título del sitio personalizado */
  customSiteTitle?: string;
  /** URL de Swagger */
  swaggerUrl?: string;
  /** Prefijo de ruta (compatibilidad) */
  routePrefix?: string;
  /** Información de la API (compatibilidad) */
  info?: {
    title: string;
    version: string;
    description?: string;
  };
  /** Base path (compatibilidad) */
  basePath?: string;
  /** Esquemas (compatibilidad) */
  schemes?: string[];
} 