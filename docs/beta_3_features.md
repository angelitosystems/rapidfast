# RapidFAST Framework Beta 3 - Nuevas características

## Documentación detallada de cambios en la versión 1.0.6-beta.3

### Integración completa de Swagger

#### Decoradores para documentación de API

RapidFAST ahora incluye un conjunto completo de decoradores para documentar tu API:

```typescript
import { 
  Controller, 
  Get,
  ApiDoc, 
  ApiParam, 
  ApiResponse, 
  ApiTags 
} from '@angelitosystems/rapidfast';

@Controller('usuarios')
@ApiTags('Usuarios')
@ApiDoc({
  description: 'API para gestión de usuarios'
})
export class UsuarioController {
  @Get(':id')
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UsuarioDto
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado'
  })
  async getById(@Param('id') id: string) {
    // Implementación...
  }
}
```

#### Configuración automática de Swagger UI

La documentación es accesible automáticamente en:
- `/api-docs` - Interfaz Swagger UI
- `/swagger.json` - Documento OpenAPI en formato JSON

No se requiere configuración adicional, todo funciona de forma predeterminada.

### Sistema modular completo

El sistema de módulos permite organizar tu aplicación en componentes reutilizables:

```typescript
// todo.module.ts
import { Module } from '@angelitosystems/rapidfast';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';

@Module({
  controllers: [TodoController],
  providers: [TodoService],
  exports: [TodoService]
})
export class TodoModule {}

// app.module.ts
import { Module } from '@angelitosystems/rapidfast';
import { TodoModule } from './todo/todo.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [TodoModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
```

### Mejoras en el contenedor de dependencias

El sistema de inyección de dependencias ha sido mejorado para:

- Detectar automáticamente ciclos de dependencias
- Mostrar advertencias para clases no decoradas
- Soportar inyección a través de constructor
- Permitir proveedores custom con `useClass`, `useValue` y `useFactory`

```typescript
@Module({
  providers: [
    UserService,
    {
      provide: 'CONFIG',
      useValue: { apiKey: 'abc123' }
    },
    {
      provide: LoggerService,
      useFactory: (config) => new LoggerService(config.level),
      inject: ['CONFIG']
    }
  ]
})
export class AppModule {}
```

### Plantillas de proyectos optimizadas

Los nuevos proyectos generados con `rapidfast new` ahora incluyen:

- Estructura modular preparada para escalar
- Ejemplo funcional de CRUD completo
- Documentación Swagger preconfigrada
- Archivos de configuración optimizados

```
src/
 ├── app/
 │   ├── app.module.ts     # Módulo principal que importa otros módulos
 │   ├── app.controller.ts # Controlador para rutas raíz
 │   ├── app.service.ts    # Servicio principal
 │   └── todo/            # Módulo de ejemplo
 │       ├── todo.module.ts
 │       ├── todo.controller.ts
 │       └── todo.service.ts
 ├── main.ts              # Punto de entrada de la aplicación
```

### Mejoras visuales y de UX

- Banner de servidor mejorado con diseño y colores más modernos
- Orden optimizado de logs para una mejor legibilidad 
- Apertura automática de Swagger UI sólo en el primer inicio
- Formateo de logs de rutas con colores según método HTTP
- Manejo mejorado de errores con mensajes más claros

### Correcciones técnicas

- Solución a problemas de compatibilidad con módulos ES
- Mejor tipado TypeScript para evitar errores `any`
- Documentación de interfaces públicas mejorada
- Eliminación de advertencias del compilador
- Compatibilidad garantizada con Node.js 20+

## Para desarrolladores que migran desde beta.2

Si estás actualizando desde la versión beta.2, ten en cuenta estos cambios:

1. **Nueva estructura de módulos**: Actualiza tu código para usar la estructura de módulos anidados
2. **Decoradores Swagger**: Reemplaza cualquier integración manual con Swagger por los nuevos decoradores
3. **Controladores en módulos**: Asegúrate de que todos los controladores estén registrados en su módulo correspondiente

## Feedback

Estamos muy interesados en escuchar tu feedback sobre estas nuevas características. Por favor, reporta cualquier problema o sugerencia en nuestro [repositorio de GitHub](https://github.com/angelitosystems/rapidfast/issues).
