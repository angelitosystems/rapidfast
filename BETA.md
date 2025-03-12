# RapidFAST Framework - Versión Beta

Esta es una versión beta del framework RapidFAST. Las versiones beta pueden contener características experimentales y están sujetas a cambios.

## Instalación

Para instalar la versión beta más reciente:

```bash
npm install @angelitosystems/rapidfast@beta
```

## Características de la versión beta

La versión beta incluye las siguientes características y mejoras:

- Soporte mejorado para TypeScript 5.3+
- Nuevos decoradores para simplificar la creación de APIs
- Mejoras en el CLI para generación de código
- Soporte para múltiples bases de datos
- Proceso de publicación beta robusto y compatible con Windows

## Reportar problemas

Si encuentras algún problema con la versión beta, por favor reporta el issue en nuestro [repositorio de GitHub](https://github.com/angelitosystems/rapidfast/issues).

## Notas de la versión

### v1.0.6-beta.2

- Proceso de publicación beta completamente rediseñado
- Nuevos scripts para facilitar el desarrollo y publicación:
  - `publish:beta:script`: Publica una versión beta con un solo comando
  - `fix:lint`: Corrige automáticamente errores de linting
  - `update:typescript`: Actualiza TypeScript a una versión compatible
- Configuración de ESLint mejorada para reducir advertencias
- Documentación ampliada para usuarios de la versión beta

### v1.0.6-beta.1

- Mejoras en la configuración de linting
- Corrección de errores en el CLI
- Mejoras en la documentación

### v1.0.6-beta.0

- Mejoras en la configuración de linting
- Corrección de errores en el CLI
- Mejoras en la documentación

### v1.0.5-beta

- Primera versión beta pública
- Implementación inicial del framework
- Soporte para Express y TypeScript

## Scripts útiles para desarrolladores

Para facilitar el desarrollo y publicación de versiones beta, se han incluido los siguientes scripts:

```bash
# Publicar una nueva versión beta
npm run publish:beta:script

# Publicar una versión beta ignorando scripts de prepublicación
npm run publish:beta:script:force

# Corregir automáticamente errores de linting
npm run fix:lint

# Actualizar TypeScript a una versión compatible con ESLint
npm run update:typescript
```

## Contribuir

¡Agradecemos tus contribuciones! Si deseas contribuir al desarrollo de RapidFAST, por favor revisa nuestra [guía de contribución](https://github.com/angelitosystems/rapidfast/blob/main/CONTRIBUTING.md).

## Licencia

RapidFAST está licenciado bajo la [Licencia MIT](https://github.com/angelitosystems/rapidfast/blob/main/LICENSE). 