// Versión del paquete
export const VERSION = '1.0.7';

// Importación de reflect-metadata para los decoradores
import 'reflect-metadata';

// Exportación de Factory y faker
export { Factory, faker } from './core/factory';

// Exportación principal del framework

// ORM
export { BaseEntity } from './orm/base.entity';

// Decoradores
export { Controller } from './decorators/controller.decorator';
export { Module } from './decorators/module.decorator';
export { Injectable } from './decorators/service.decorator';
export { Inject } from './decorators/inject.decorator';
export { Get, Post, Put, Delete, Patch, Options, Head, All } from './decorators/route.decorators';
export { Param, Body, Query, Headers, Request, Response, Req, Res } from './decorators/param.decorators';
export { InjectRepository } from './decorators/repository.decorator';
export { Entity } from './decorators/entity.decorator'; // Asegúrese de usar la versión actualizada
// Decoradores de validación
export { IsEmail, IsString, MinLength, IsOptional, Transform } from './decorators/validation.decorators';

// Decoradores Swagger
export { ApiDoc, ApiParam, ApiBody, ApiResponse, ApiTags, ApiDescription, ApiProperty } from './decorators/swagger.decorators';

// Core
export { RapidFastApplication, Application } from './core/application';
// Exportar el alias RapidFast para la clase Application
export { Application as RapidFast } from './core/application';
export * from './core/module';
export * from './core/database.module';
export * from './core/controller';
// Exportar el manejador de Swagger
export { SwaggerManager } from './core/swagger';
// Exportar excepciones HTTP
export { HttpException, BadRequestException, UnauthorizedException, NotFoundException, ForbiddenException, InternalServerErrorException } from './core/exceptions';
export { HttpStatus } from './core/http-status.enum';

// ORM
export * from './orm/column';
export * from './orm/relations';
export * from './orm/entity';
export * from './orm/database';
// Exportar tipos de TypeORM
export { Repository, EntityTarget, FindOptionsWhere, DeepPartial, DataSource, DataSourceOptions, QueryRunner, Table, MigrationInterface } from 'typeorm';

// Interfaces
export * from './interfaces/module.interface';
export * from './interfaces/controller.interface';
export * from './interfaces/type.interface';
export { ParamType as ParamTypeInterface } from './interfaces/param.interface';
export * from './interfaces/service.interface';
export * from './interfaces/swagger.interface';
export * from './interfaces/database.interface';

// Utilidades
export * from './utils/logger';
export * from './utils/config';
export * from './utils/validator';
export * from './utils/database-config.util';
// Exportar la utilidad de configuración como env
export { Config as env } from './utils/config';
export * from './utils/cli';
