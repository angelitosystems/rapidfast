import { DatabaseConfig } from '../interfaces/database.interface';

/**
 * Configuración de base de datos para el modo CLI
 * Esta configuración se usa cuando se ejecutan comandos CLI como 'new' o 'generate'
 */
const databaseConfig: DatabaseConfig = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'rapidfast_dev',
  synchronize: false,
  logging: false,
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
  subscribers: ['src/database/subscribers/**/*.ts'],
  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 30000
  }
};

export default databaseConfig; 