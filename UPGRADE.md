# Guía de Actualización de RapidFAST

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