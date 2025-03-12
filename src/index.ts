// Versión del paquete
export const VERSION = '1.0.0';

// Exportación principal del framework

// Decoradores
export { Module } from './decorators/module.decorator';
export { Injectable } from './decorators/service.decorator';
export { Controller } from './decorators/controller.decorator';
export * from './decorators/route.decorator';
export * from './decorators/param.decorators';
export * from './decorators/inject.decorator';
export * from './decorators/repository.decorator';

// Core
export { RapidFastApplication, Application } from './core/application';
export * from './core/module';
export * from './core/database.module';

// ORM
export * from './orm/column';
export * from './orm/relations';

// Interfaces
export * from './interfaces/module.interface';
export * from './interfaces/controller.interface';
export * from './interfaces/type.interface';
export { ParamType as ParamTypeInterface } from './interfaces/param.interface';
export * from './interfaces/service.interface';

// Utilidades
export * from './utils/logger';