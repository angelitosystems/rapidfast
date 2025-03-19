import { ConnectionOptions } from 'typeorm';
import { join } from 'path';

export const ormConfig: ConnectionOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'rapidfast',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../orm/migrations/*{.ts,.js}')],
  subscribers: [join(__dirname, '../orm/subscribers/*{.ts,.js}')]
}; 