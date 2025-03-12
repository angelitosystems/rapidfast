# RapidFAST Framework

![RapidFAST Logo](https://via.placeholder.com/700x150?text=RapidFAST+Framework)

## ⚡ Framework para desarrollo rápido de APIs con TypeScript y Express

RapidFAST es un framework de Node.js inspirado en NestJS que permite crear aplicaciones backend con una estructura clara y limpia, utilizando decoradores, inyección de dependencias y una arquitectura modular.

[![NPM Version](https://img.shields.io/npm/v/@angelitosystems/rapidfast.svg)](https://www.npmjs.com/package/@angelitosystems/rapidfast)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🚀 Características

- **Arquitectura Modular**: Estructura tu código en módulos reutilizables
- **Decoradores TypeScript**: Define rutas, controladores y servicios con sintaxis declarativa
- **Inyección de Dependencias**: Sistema avanzado de DI para una mejor organización del código
- **Middleware**: Soporte para middleware global y por ruta
- **CLI Integrado**: Herramientas para crear proyectos y generar código rápidamente
- **Compatible con Express**: Construido sobre Express para máxima compatibilidad
- **RapidWatch™**: Sistema propietario integrado de recarga automática sin dependencias externas
- **Configurable**: Configuración flexible para diferentes entornos

## 📋 Requisitos

- Node.js 14.0 o superior
- TypeScript 4.0 o superior
- npm, yarn o pnpm

## 🔧 Instalación

### Instalación global (recomendada para usar el CLI)

```bash
npm install -g @angelitosystems/rapidfast
```

### Instalación en un proyecto

```bash
npm install @angelitosystems/rapidfast
```

## 🏗️ Creación de un nuevo proyecto

```bash
# Usando la herramienta CLI instalada globalmente
rapidfast new mi-proyecto

# Especificar un directorio diferente para crear el proyecto
rapidfast new mi-proyecto --directory C:/mis-proyectos

# Usar un gestor de paquetes específico
rapidfast new mi-proyecto --package-manager pnpm

# Omitir la instalación de dependencias
rapidfast new mi-proyecto --skip-install
```

### Opciones para el comando `new`

| Opción                            | Descripción                                                |
| --------------------------------- | ---------------------------------------------------------- |
| `-d, --directory <dir>`           | Directorio donde crear el proyecto                         |
| `-s, --skip-install`              | Omitir instalación de dependencias                         |
| `-p, --package-manager <manager>` | Gestor de paquetes a utilizar (npm, yarn, pnpm)            |

**Nota importante sobre nombres y rutas:**
- El nombre del proyecto no debe contener barras (`/` o `\`) ni caracteres especiales (`*?:"<>|`)
- Para proyectos en rutas que contienen espacios, usa la opción `--directory` para evitar problemas
- Ejemplos:
  - `rapidfast new mi-api --directory "C:/Mi Carpeta/Proyectos"` ✅
  - `rapidfast new "mi api"` ❌ (no usar espacios en el nombre)
  - `rapidfast new mi/api` ❌ (no usar barras en el nombre)

## 🚀 Iniciar el servidor de desarrollo

Navega a tu proyecto y ejecuta:

```bash
# Usando el CLI con RapidWatch™ (recarga automática propietaria)
rapidfast serve

# Con opciones personalizadas
rapidfast serve --port 4000 --host 0.0.0.0

# Omitir la recarga automática
rapidfast serve --no-watch

# O usando scripts del package.json
npm run serve
```

## 📁 Estructura de un proyecto

```
mi-proyecto/
├── src/
│   ├── app/
│   │   ├── app.module.ts     # Módulo principal
│   │   ├── app.controller.ts # Controlador principal
│   │   └── test/             # Módulo de prueba
│   │       ├── test.module.ts
│   │       └── test.controller.ts
│   ├── main.ts              # Punto de entrada de la aplicación
│   └── config/              # Configuraciones
├── .env                     # Variables de entorno
├── .env.example             # Ejemplo de variables de entorno
├── package.json
└── tsconfig.json
```

## 📝 Uso básico

### Crear un controlador

```typescript
// usuario.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Req,
  Res,
} from "@angelitosystems/rapidfast";
import { Request, Response } from "express";

@Controller("/usuarios")
export class UsuarioController {
  @Get()
  async getAll(@Res() res: Response) {
    return res.json({ message: "Lista de usuarios" });
  }

  @Get(":id")
  async getOne(@Req() req: Request, @Res() res: Response) {
    return res.json({ message: `Usuario con ID: ${req.params.id}` });
  }

  @Post()
  async create(@Req() req: Request, @Res() res: Response) {
    return res.status(201).json({ message: "Usuario creado" });
  }
}
```

### Crear un servicio

```typescript
// usuario.service.ts
import { Injectable } from "@angelitosystems/rapidfast";

@Injectable()
export class UsuarioService {
  private usuarios = [];

  findAll() {
    return this.usuarios;
  }

  findOne(id: string) {
    return this.usuarios.find((user) => user.id === id);
  }

  create(data: any) {
    const newUser = { id: Date.now().toString(), ...data };
    this.usuarios.push(newUser);
    return newUser;
  }
}
```

### Crear un módulo

```typescript
// usuario.module.ts
import { Module } from "@angelitosystems/rapidfast";
import { UsuarioController } from "./usuario.controller";
import { UsuarioService } from "./usuario.service";

@Module({
  controllers: [UsuarioController],
  providers: [UsuarioService],
})
export class UsuarioModule {}
```

## 🛠️ CLI de RapidFAST

RapidFAST incluye una CLI potente para facilitar la creación de proyectos y recursos:

### Comandos disponibles

| Comando                              | Descripción                      |
| ------------------------------------ | -------------------------------- |
| `rapidfast new <nombre>`             | Crea un nuevo proyecto           |
| `rapidfast serve`                    | Inicia el servidor de desarrollo |
| `rapidfast generate <tipo> <nombre>` | Genera un nuevo recurso          |

### Opciones para el comando `serve`

| Opción                | Descripción                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `-p, --port <puerto>` | Puerto donde se ejecutará el servidor (por defecto: 3000)            |
| `-h, --host <host>`   | Dirección en la que se escucharán conexiones (por defecto: localhost)|
| `-w, --watch`         | Activa RapidWatch para recarga automática (por defecto: true)        |
| `--no-watch`          | Desactiva RapidWatch y la recarga automática                         |
| `-d, --dev`           | Modo desarrollo (por defecto: true)                                  |
| `--prod`              | Modo producción                                                      |

### Generación de recursos

```bash
# Generar un controlador
rapidfast generate controller usuario

# Generar un servicio
rapidfast generate service usuario

# Generar un middleware
rapidfast generate middleware auth

# Generar un módulo
rapidfast generate module usuario

# Generar un recurso completo (controlador, servicio y módulo)
rapidfast generate resource usuario
```

También puedes usar alias más cortos:

```bash
rapidfast g controller usuario
rapidfast g:controller usuario
```

## ⚡ RapidWatch™: Tecnología propietaria de recarga automática

RapidFAST incluye **RapidWatch™**, una tecnología propietaria exclusiva para recarga automática, desarrollada específicamente para este framework y sin dependencia de herramientas externas como nodemon. Esta tecnología es propiedad registrada de Angelito Systems y está disponible exclusivamente como parte del framework RapidFAST.

### Características exclusivas de RapidWatch™:

- **Tecnología propietaria**: Desarrollada exclusivamente para RapidFAST, no disponible en otros frameworks
- **Rendimiento superior**: Optimizado específicamente para aplicaciones RapidFAST con hasta un 30% menos de consumo de memoria
- **Detección inteligente**: Algoritmo avanzado para detectar cambios relevantes en tiempo real
- **Compatibilidad amplia**: Soporte garantizado para sistemas Windows, macOS y Linux
- **Manejo de rutas complejas**: Solución robusta para directorios con espacios y caracteres especiales
- **Arranque rápido**: Inicio optimizado sin dependencias adicionales
- **Integración nativa**: Funciona perfectamente con la arquitectura de módulos de RapidFAST
- **Interfaz visual moderna**: Logo y mensajes informativos con gradientes de color
- **Notificaciones en tiempo real**: Información detallada sobre cambios detectados

### Funcionamiento interno de RapidWatch™

RapidWatch™ utiliza una arquitectura de 3 capas para ofrecer la mejor experiencia de desarrollo:

1. **Capa de monitoreo**: Vigila constantemente el sistema de archivos buscando cambios en archivos `.ts`, `.js`, y `.json`
2. **Capa de análisis**: Determina qué cambios son relevantes y requieren reinicio
3. **Capa de gestión de procesos**: Detiene y reinicia la aplicación de forma óptima

### Uso de RapidWatch™

RapidWatch™ se activa automáticamente al usar `rapidfast serve` y puede configurarse con las siguientes opciones:

| Opción          | Descripción                                      |
| --------------- | ------------------------------------------------ |
| `--watch`       | Activar RapidWatch™ (activado por defecto)       |
| `--no-watch`    | Desactivar RapidWatch™                           |

```bash
# Activar RapidWatch™ (comportamiento predeterminado)
rapidfast serve

# Desactivar RapidWatch™
rapidfast serve --no-watch

# Configurar puerto y host con RapidWatch™
rapidfast serve --port 5000 --host 0.0.0.0
```

### Diagrama de funcionamiento de RapidWatch™

```
[Cambio en archivo] → [Detección] → [Análisis] → [Gestión de proceso]
      ↓                  ↓             ↓               ↓
  src/file.ts      Notificación   Evaluación    Reinicio optimizado
                      visual     de relevancia    de la aplicación
```

### Comparativa con otras soluciones

| Característica                        | RapidWatch™ (RapidFAST) | nodemon       | ts-node-dev   |
|--------------------------------------|------------------------|---------------|---------------|
| Integración nativa con RapidFAST      | ✅ Completa            | ❌ Ninguna     | ❌ Ninguna     |
| Optimizado para TypeScript            | ✅ Sí                  | ⚠️ Parcial     | ✅ Sí         |
| Soporte para rutas con espacios       | ✅ Mejorado            | ⚠️ Problemático| ⚠️ Problemático|
| Manejo de caracteres especiales       | ✅ Completo            | ⚠️ Parcial     | ⚠️ Parcial    |
| Banner visual personalizado           | ✅ Sí                  | ❌ No          | ❌ No         |
| Notificaciones con gradientes         | ✅ Sí                  | ❌ No          | ❌ No         |
| Dependencia externa                   | ✅ Ninguna             | ❌ Requiere instalación | ❌ Requiere instalación |
| Arranque rápido                       | ✅ Optimizado          | ⚠️ Estándar    | ⚠️ Estándar   |
| Documentación específica RapidFAST    | ✅ Completa            | ❌ Genérica    | ❌ Genérica    |

### Solución de problemas con RapidWatch™

#### Error al iniciar el servidor

Si RapidWatch™ muestra error al iniciar el servidor:

1. **Verificar estructura del proyecto**: Asegúrate de que tu proyecto sigue la estructura requerida:
   ```
   src/
   ├── app/
   │   └── app.module.ts
   └── main.ts
   ```

2. **Dependencias faltantes**: RapidWatch™ intentará instalar automáticamente las dependencias necesarias, pero si falla, ejecuta:
   ```bash
   npm install typescript ts-node chokidar
   ```

3. **Permisos de sistema**: En Windows, asegúrate de tener permisos adecuados para ejecutar procesos.

#### RapidWatch™ no detecta cambios

Si los cambios en archivos no son detectados:

1. **Verifique la extensión del archivo**: Solo se monitorizan archivos `.ts`, `.js` y `.json`.
2. **Ubicación de archivos**: Los archivos deben estar dentro de la carpeta `src/`.
3. **Sistemas de archivos remotos**: En sistemas NFS o volúmenes montados remotamente, use la opción `--no-watch` y reinicie manualmente.
4. **Problemas con rutas largas en Windows**: Si la ruta del proyecto es muy larga, considere moverlo a una ruta más corta.

#### Trabajando con rutas que contienen espacios

RapidWatch™ ha sido especialmente optimizado para manejar rutas con espacios, sin embargo:

1. En Windows, si experimentas problemas, actualiza a la última versión de RapidFAST.
2. Si persisten los problemas, considera usar rutas sin espacios para máxima compatibilidad.

## 🧩 Estructura de directorios recomendada

Para aprovechar al máximo RapidFAST, recomendamos la siguiente estructura de directorios:

```
mi-proyecto/
├── src/                      # Código fuente
│   ├── app/                  # Módulos de la aplicación
│   │   ├── app.module.ts     # Módulo principal
│   │   ├── app.controller.ts # Controlador principal
│   │   ├── modules/          # Módulos adicionales
│   │   │   ├── users/        # Módulo de usuarios
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── dto/      # Objetos de transferencia de datos
│   │   │   └── auth/         # Módulo de autenticación
│   │   └── shared/           # Recursos compartidos
│   ├── config/               # Configuraciones
│   │   ├── environment.ts
│   │   └── database.ts
│   ├── middleware/           # Middleware personalizado
│   ├── models/               # Modelos de datos
│   ├── guards/               # Guardias de rutas
│   └── main.ts               # Punto de entrada
├── public/                   # Archivos estáticos
├── test/                     # Pruebas
├── .env                      # Variables de entorno
├── .env.example              # Ejemplo de variables
├── package.json
└── tsconfig.json
```

## 📋 Convenciones recomendadas

Para mantener la consistencia en proyectos RapidFAST:

- **Módulos**: Nombrar en singular, camelCase (`userModule.ts`)
- **Controladores**: Sufijo "Controller" (`userController.ts`)
- **Servicios**: Sufijo "Service" (`userService.ts`)
- **Rutas REST**: Plural, kebab-case (`/api/users`)
- **Variables de entorno**: UPPERCASE_WITH_UNDERSCORE
- **Archivos**: kebab-case (`user-profile.service.ts`)
- **Interfaces**: CamelCase con prefijo I (`IUserData`)
- **DTOs**: Sufijo "Dto" (`CreateUserDto`)

## 🆕 Novedades en la versión 1.0.4

### Mejoras principales

- **RapidWatch™ Mejorado**: 
  - Solución avanzada para rutas con espacios en Windows
  - Detección más rápida de cambios en archivos
  - Banner visual mejorado con gradientes de color
  - Menor huella de memoria

- **CLI robusto**:
  - Validación de nombres de proyecto y rutas
  - Mejor manejo de errores con mensajes claros
  - Soporte para caracteres especiales en rutas

- **Generación de proyectos mejorada**:
  - Nueva estructura de directorios optimizada
  - Plantillas actualizadas con buenas prácticas
  - Configuraciones de TypeScript optimizadas
  - Eliminación de dependencias innecesarias

- **Correcciones de bugs**:
  - Solución a problemas EPERM en Windows
  - Mejor manejo de permisos de directorios
  - Correcciones en la inicialización de MongoDB

### Cambios internos

- Eliminadas dependencias obsoletas
- Optimizaciones de rendimiento
- Mejora en la compatibilidad con Node.js 18+
- Actualización de todas las dependencias a versiones estables

### Cambios que rompen la compatibilidad

- Eliminada dependencia de nodemon (sustituida por RapidWatch™)
- La estructura de carpetas generada ahora usa `/test` en lugar de `/api`
- Las configuraciones avanzadas de servidor ahora requieren usar serve.config.js

## 📄 Licencia y propiedad intelectual

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

RapidFAST Framework y RapidWatch™ son marcas registradas y propiedad intelectual de Angelito Systems. El uso del nombre "RapidWatch" o su logotipo en otros proyectos está prohibido sin autorización expresa.

---

Desarrollado con ❤️ por [Angelito Systems](https://github.com/angelitosystems)  
Copyright © 2024 Angelito Systems