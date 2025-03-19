export type DatabaseType = 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
export type DatabaseDriver = 'mysql' | 'mysql2' | 'postgres' | 'sqlite' | 'mariadb';

export interface DatabasePoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis?: number;
}

export interface DatabaseSSLConfig {
  rejectUnauthorized: boolean;
}

export interface DatabaseConnectionConfig {
  type?: DatabaseType;
  driver?: DatabaseDriver;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  synchronize?: boolean;
  logging?: boolean;
  entities?: string[];
  migrations?: string[];
  subscribers?: string[];
  ssl?: DatabaseSSLConfig;
  pool?: DatabasePoolConfig;
}

export interface DatabaseConfig {
  default?: string;
  connections?: {
    [key: string]: DatabaseConnectionConfig;
  };
  type?: DatabaseType;
  driver?: DatabaseDriver;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  synchronize?: boolean;
  logging?: boolean;
  entities?: string[];
  migrations?: string[];
  subscribers?: string[];
  ssl?: DatabaseSSLConfig;
  pool?: DatabasePoolConfig;
} 