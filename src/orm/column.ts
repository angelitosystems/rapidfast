import 'reflect-metadata';
import { Column as TypeOrmColumn, CreateDateColumn as TypeOrmCreateDateColumn, UpdateDateColumn as TypeOrmUpdateDateColumn, PrimaryColumn as TypeOrmPrimaryColumn, PrimaryGeneratedColumn as TypeOrmPrimaryGeneratedColumn, ColumnOptions } from 'typeorm';

// Re-exportar decoradores de TypeORM
export { ColumnOptions };
export const Column = TypeOrmColumn;
export const CreateDateColumn = TypeOrmCreateDateColumn;
export const UpdateDateColumn = TypeOrmUpdateDateColumn;
export const PrimaryColumn = TypeOrmPrimaryColumn;
export const PrimaryGeneratedColumn = TypeOrmPrimaryGeneratedColumn;