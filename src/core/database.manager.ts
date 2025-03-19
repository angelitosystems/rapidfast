import { Connection, getRepository, Repository, createConnection, ObjectLiteral } from 'typeorm';
import { getConnectionConfig, normalizeConnectionConfig } from '../utils/database-config.util';
import { Logger } from '../utils/logger';
import { isCliMode } from '../utils/cli';
import { DatabaseConfig } from '../interfaces/database.interface';

// Importar la configuración adecuada según el modo
let databaseConfig: DatabaseConfig;
if (isCliMode()) {
  // En modo CLI, usar la configuración CLI
  databaseConfig = require('../config/database.cli').default;
} else {
  // En modo normal, usar la configuración normal
  try {
    databaseConfig = require('../config/database').default;
  } catch (error) {
    console.error('Error al cargar la configuración de la base de datos:', error);
    // Configuración por defecto
    databaseConfig = {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'rapidfast_dev'
    };
  }
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connection: Connection | null = null;
  private readonly logger: Logger;
  private repositories: Map<string, Repository<ObjectLiteral>> = new Map();

  private constructor() {
    this.logger = new Logger();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private async createDatabaseIfNotExists(config: any): Promise<void> {
    if (config.type !== 'mysql') return;

    const tempConfig = { ...config };
    delete tempConfig.database;

    try {
      const tempConnection = await createConnection(tempConfig);
      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
      await tempConnection.close();
      this.logger.info(`Base de datos '${config.database}' creada o verificada`);
    } catch (error) {
      this.logger.error('Error al crear la base de datos:', error);
      throw error;
    }
  }

  public async initialize(connectionName?: string): Promise<void> {
    // No inicializar la conexión en modo CLI
    if (isCliMode()) {
      this.logger.debug('Modo CLI detectado, omitiendo conexión a la base de datos');
      return;
    }

    if (this.connection) {
      return;
    }

    try {
      const connectionConfig = getConnectionConfig(databaseConfig, connectionName);
      const normalizedConfig = normalizeConnectionConfig(connectionConfig);
      
      // Intentar crear la base de datos si no existe
      await this.createDatabaseIfNotExists(normalizedConfig);
      
      this.connection = await createConnection(normalizedConfig as any);
      this.logger.info(`Conexión a la base de datos establecida (${normalizedConfig.type})`);
    } catch (error) {
      this.logger.error('Error al conectar con la base de datos:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    if (!this.connection) {
      return;
    }

    try {
      await this.connection.close();
      this.connection = null;
      this.repositories.clear();
      this.logger.info('Conexión a la base de datos cerrada');
    } catch (error) {
      this.logger.error('Error al cerrar la conexión a la base de datos:', error);
      throw error;
    }
  }

  public getRepository<T extends ObjectLiteral>(entity: new () => T): Repository<T> {
    // En modo CLI, devolver un mock del repositorio
    if (isCliMode()) {
      this.logger.debug('Modo CLI detectado, devolviendo repositorio mock');
      return {} as Repository<T>;
    }

    if (!this.connection) {
      throw new Error('La conexión a la base de datos no está inicializada');
    }

    const entityName = entity.name;
    if (!this.repositories.has(entityName)) {
      const repository = getRepository(entity, this.connection.name);
      this.repositories.set(entityName, repository as Repository<ObjectLiteral>);
    }

    return this.repositories.get(entityName) as Repository<T>;
  }

  public getConnection(): Connection {
    // En modo CLI, devolver un mock de la conexión
    if (isCliMode()) {
      this.logger.debug('Modo CLI detectado, devolviendo conexión mock');
      return {} as Connection;
    }

    if (!this.connection) {
      throw new Error('La conexión a la base de datos no está inicializada');
    }
    return this.connection;
  }
}