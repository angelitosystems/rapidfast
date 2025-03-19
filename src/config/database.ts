import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { OrmConfig } from '../interfaces/orm.interface';
import { env } from '../utils/env';
import { isCliMode } from '../utils/cli';
import { join } from 'path';

const baseConfig: Partial<OrmConfig> = {
  type: 'mysql',
  synchronize: false,
  logging: env('DB_LOGGING', 'false', false) === 'true',
  entities: ['src/entities/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/**/*.{ts,js}'],
  subscribers: ['src/database/subscribers/**/*.{ts,js}'],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/database/migrations',
    subscribersDir: 'src/database/subscribers',
    seedersDir: 'src/database/seeders',
    factoriesDir: 'src/database/factories'
  },
  seeder: {
    directory: 'src/database/seeders',
    defaultSeeder: ['UserSeeder']
  },
  factory: {
    directory: 'src/database/factories'
  },
  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 30000
  }
};

const developmentConfig: Partial<OrmConfig> = {
  ...baseConfig,
  type: 'mysql' as const,
  host: env('DB_HOST', 'localhost', isCliMode()),
  port: parseInt(env('DB_PORT', '3306', isCliMode())),
  username: env('DB_USERNAME', 'root', isCliMode()),
  password: env('DB_PASSWORD', '', isCliMode()),
  database: env('DB_DATABASE', 'rapidfast_dev', isCliMode())
};

const testConfig: Partial<OrmConfig> = {
  ...baseConfig,
  type: 'mysql' as const,
  host: env('TEST_DB_HOST', 'localhost', isCliMode()),
  port: parseInt(env('TEST_DB_PORT', '3306', isCliMode())),
  username: env('TEST_DB_USERNAME', 'root', isCliMode()),
  password: env('TEST_DB_PASSWORD', '', isCliMode()),
  database: env('TEST_DB_DATABASE', 'rapidfast_test', isCliMode()),
  pool: {
    min: 0,
    max: 5,
    idleTimeoutMillis: 30000
  }
};

const productionConfig: Partial<OrmConfig> = {
  ...baseConfig,
  type: 'mysql' as const,
  host: env('DB_HOST', 'localhost', isCliMode()),
  port: parseInt(env('DB_PORT', '3306', isCliMode())),
  username: env('DB_USERNAME', 'root', isCliMode()),
  password: env('DB_PASSWORD', '', isCliMode()),
  database: env('DB_DATABASE', 'rapidfast_prod', isCliMode()),
  ssl: {
    rejectUnauthorized: false
  }
};

export const databaseConfig: OrmConfig = {
  type: process.env.DB_TYPE as any || 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'rapidfast',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
  subscribers: [join(__dirname, '../database/subscribers/*{.ts,.js}')],
  cli: {
    entitiesDir: join(__dirname, '../entities'),
    migrationsDir: join(__dirname, '../database/migrations'),
    subscribersDir: join(__dirname, '../database/subscribers'),
    seedersDir: join(__dirname, '../database/seeders'),
    factoriesDir: join(__dirname, '../database/factories')
  },
  seeder: {
    directory: join(__dirname, '../database/seeders'),
    defaultSeeder: ['UserSeeder']
  },
  factory: {
    directory: join(__dirname, '../database/factories')
  }
};