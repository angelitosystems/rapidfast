# Guía de Actualización de RapidFAST

## Actualización a la versión 1.0.6-beta.8

### Nuevas Características

La versión 1.0.6-beta.8 de RapidFAST incluye importantes mejoras en la configuración de Swagger y la documentación de API:

1. **Decorador de Controller mejorado con soporte para Swagger**
2. **Agrupación directa de endpoints en controladores**
3. **Sistema de procesamiento de rutas optimizado**

### Cómo usar las nuevas características

#### Decorador de Controller mejorado

Ahora puedes configurar tags y descripciones de Swagger directamente en el decorador `@Controller`:

```typescript
// Antiguo método
@Controller('/usuarios')
@ApiDoc({
  tags: ['Usuarios'],
  description: 'API para gestionar usuarios'
})
export class UsuarioController {
  // ...
}

// Nuevo método (recomendado)
@Controller({
  prefix: '/usuarios',
  tags: ['Usuarios'],
  description: 'API para gestionar usuarios'
})
export class UsuarioController {
  // ...
}
```

Este cambio facilita la organización de tus endpoints en la documentación Swagger y mantiene toda la configuración de un controlador en un solo lugar.

#### Migración gradual

Puedes migrar tus controladores gradualmente, ya que mantenemos compatibilidad con el decorador `@ApiDoc`:

1. El sistema combinará los tags de ambos decoradores si usas ambos
2. Si no defines tags en ninguno, se usará el nombre de la clase como tag

#### Nueva interfaz RouteOptions

También puedes proporcionar opciones adicionales a los decoradores de ruta:

```typescript
@Get('/', {
  middleware: [authMiddleware],
  swagger: {
    summary: 'Obtener todos los usuarios',
    description: 'Devuelve la lista completa de usuarios del sistema',
    tags: ['Administración']  // Sobrescribe los tags del controlador para esta ruta
  }
})
async getAll() {
  // ...
}
```

### Mejoras en los tipos y la configuración

Se han corregido varios problemas con los tipos en la configuración de Swagger:

1. Valores por defecto para propiedades requeridas
2. Mejor manejo de servidores en la configuración
3. Solución a errores cuando las descripciones son opcionales

Para aprovechar estas mejoras no necesitas hacer cambios en tu código, todo funciona automáticamente al actualizar.

### ¿Algún problema?

Si encuentras algún problema al actualizar o usar las nuevas características, consulta la documentación oficial o reporta un issue en nuestro repositorio de GitHub.

## Actualización a la versión 1.0.6-beta.7

### Nuevas Características

La versión 1.0.6-beta.7 de RapidFAST incluye importantes mejoras en la configuración y detección de cambios:

1. **Configuración TypeScript para Swagger**
2. **Recarga de variables de entorno sin reinicio**
3. **RapidWatch mejorado para cualquier tipo de archivo**

### Cómo usar las nuevas características

#### Configuración TypeScript para Swagger

Ahora puedes configurar Swagger mediante un archivo TypeScript, lo que proporciona autocompletado y validación:

1. Crea un archivo `config/swagger.config.ts` en la raíz de tu proyecto:

```typescript
export default {
  // Información básica de la API
  title: 'Mi API Personalizada',
  description: 'Documentación de mi API con RapidFAST',
  version: '1.0.0',
  
  // Configuración de UI
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  
  // Ruta donde se servirá Swagger UI
  routePrefix: '/api-docs'
};
```

2. La configuración se cargará automáticamente al iniciar el servidor.

3. Las variables de entorno siguen teniendo prioridad, por lo que puedes sobrescribir valores:

```
# .env
SWAGGER_TITLE=Título personalizado desde env
SWAGGER_ROUTE_PREFIX=/documentacion
```

#### Recarga de variables de entorno

Ahora al modificar archivos `.env`, las variables se recargan sin necesidad de reiniciar el servidor:

1. Inicia tu servidor con `rapidfast serve`
2. Modifica el archivo `.env` mientras el servidor está en ejecución
3. Las variables se actualizarán automáticamente sin reiniciar

Esta función es especialmente útil durante el desarrollo, permitiendo ajustar configuraciones sin interrupciones.

#### RapidWatch Mejorado

RapidWatch ahora monitorea muchos más tipos de archivos:

1. Archivos `.env` y sus variantes (`.env.development`, etc.)
2. Archivos de configuración en `config/`
3. Archivos estáticos en `public/` y `static/`
4. Plantillas en `templates/`

No se requiere configuración adicional, esto funciona automáticamente al usar `rapidfast serve`.

### Mejoras en la estructura de proyecto

Si estás creando un nuevo proyecto con esta versión, notarás que la estructura incluye un directorio `config/` para almacenar archivos de configuración. Para proyectos existentes, puedes crear manualmente este directorio:

```bash
mkdir -p config
touch config/swagger.config.ts
```

Para obtener la nueva plantilla de archivo `.env`, puedes ejecutar:

```bash
rapidfast generate:env
```

### ¿Algún problema?

Si encuentras algún problema al actualizar o usar las nuevas características, consulta la documentación oficial o reporta un issue en nuestro repositorio de GitHub.

## Actualización a la versión 1.0.0

### Cambios importantes

En la versión 1.0.0 de RapidFAST, hemos realizado algunos cambios en la API que pueden afectar a los proyectos existentes:

1. El método `app.register()` ha sido reemplazado por `app.initialize([])` para registrar módulos.

### Cómo actualizar

Tienes dos opciones para actualizar tus proyectos existentes:

#### Opción 1: Usar el comando fix

La forma más sencilla es utilizar el comando `fix` incluido en la CLI:

```bash
# Navega a tu proyecto
cd mi-proyecto

# Ejecuta el comando fix
npx @angelitosystems/rapidfast fix
```

O si tienes RapidFAST instalado globalmente:

```bash
rapidfast fix
```

#### Opción 2: Actualización manual

Si prefieres actualizar manualmente, sigue estos pasos:

1. Abre el archivo `src/main.ts` de tu proyecto
2. Busca la línea que contiene `await app.register(AppModule);`
3. Reemplázala por `await app.initialize([AppModule]);`

### Ejemplo

Antes:

```typescript
import { Application } from '@angelitosystems/rapidfast';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = new Application();
  
  await app.register(AppModule);
  await app.listen(3000);
  
  console.log('Servidor iniciado en http://localhost:3000');
}

bootstrap().catch(console.error);
```

Después:

```typescript
import { Application } from '@angelitosystems/rapidfast';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = new Application();
  
  await app.initialize([AppModule]);
  await app.listen(3000);
  
  console.log('Servidor iniciado en http://localhost:3000');
}

bootstrap().catch(console.error);
```

## ¿Problemas?

Si encuentras algún problema durante la actualización, por favor reporta un issue en nuestro repositorio de GitHub o contacta con nuestro equipo de soporte. 