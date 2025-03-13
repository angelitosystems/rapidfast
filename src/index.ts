// Versión del paquete
export const VERSION = '1.0.6-beta.2';

// Importación de reflect-metadata para los decoradores
import 'reflect-metadata';

// Exportación principal del framework

// Decoradores
export { Controller } from './decorators/controller.decorator';
export { Module } from './decorators/module.decorator';
export { Injectable } from './decorators/service.decorator';
export { Inject } from './decorators/inject.decorator';
export { Get, Post, Put, Delete, Patch, Options, Head } from './decorators/route.decorators';
export { Param, Body, Query, Headers, Request, Response, Req, Res } from './decorators/param.decorators';
export { InjectRepository } from './decorators/repository.decorator';

// Decoradores Swagger
export { ApiDoc, ApiParam, ApiBody, ApiResponse, ApiTags, ApiProperty } from './decorators/swagger.decorators';

// Core
export { RapidFastApplication, Application } from './core/application';
export * from './core/module';
export * from './core/database.module';
export * from './core/controller';

// ORM
export * from './orm/column';
export * from './orm/relations';
export * from './orm/entity';
export * from './orm/database';

// Interfaces
export * from './interfaces/module.interface';
export * from './interfaces/controller.interface';
export * from './interfaces/type.interface';
export { ParamType as ParamTypeInterface } from './interfaces/param.interface';
export * from './interfaces/service.interface';

// Utilidades
export * from './utils/logger';
export * from './utils/config';
export * from './utils/validator';
