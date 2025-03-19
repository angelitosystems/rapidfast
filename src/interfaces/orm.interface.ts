import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';

export interface SeederConfig {
  directory: string;
  defaultSeeder?: string[];
}

export interface FactoryConfig {
  directory: string;
}

export interface CliConfig {
  entitiesDir: string;
  migrationsDir: string;
  subscribersDir: string;
  seedersDir: string;
  factoriesDir: string;
}

export type BaseConnectionOptions = MysqlConnectionOptions | PostgresConnectionOptions | SqliteConnectionOptions;

export interface PoolConfig {
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
}

export type OrmConfig = (MysqlConnectionOptions | PostgresConnectionOptions | SqliteConnectionOptions) & {
  seeder?: SeederConfig;
  factory?: FactoryConfig;
  cli?: CliConfig;
  pool?: PoolConfig;
}