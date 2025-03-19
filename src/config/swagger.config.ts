/**
 * Configuración de Swagger UI para RapidFAST
 * 
 * Este archivo permite personalizar la configuración de Swagger UI
 * Las opciones aquí definidas se pueden sobrescribir mediante variables de entorno
 */

export default {
  // Habilitar o deshabilitar Swagger
  enabled: true,
  
  // Información básica de la API
  title: process.env.APP_NAME || 'RapidFAST API',
  description: process.env.APP_DESCRIPTION || 'API Documentation generated with RapidFAST',
  version: process.env.APP_VERSION || '1.0.0',
  
  // Ruta donde se servirá Swagger UI
  routePrefix: '/api-docs',
  
  // Configuración de servidores
  servers: [
    {
      url: '/',
      description: 'Development server'
    }
  ],
  
  // Opciones de UI
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'RapidFAST API Documentation',
  
  // Tags globales adicionales
  tags: [
    { 
      name: 'System', 
      description: 'System related endpoints' 
    }
  ],
  
  // Configuración de seguridad
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  },
  
  // Configuración adicional
  swaggerOptions: {
    persistAuthorization: true
  }
};