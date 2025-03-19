import { createConnection, Connection, ConnectionOptions } from 'typeorm';
import { Logger } from '../utils/logger';

export class Database {
  private static instance: Database;
  private connection: Connection | null = null;
  private readonly logger: Logger;

  private constructor() {
    this.logger = new Logger();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(options: ConnectionOptions): Promise<Connection> {
    try {
      if (this.connection) {
        return this.connection;
      }

      this.connection = await createConnection(options);
      this.logger.info(`Connected to ${options.type} database`);
      return this.connection;
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.logger.info('Database connection closed');
    }
  }

  public getConnection(): Connection {
    if (!this.connection) {
      throw new Error('Database connection not established');
    }
    return this.connection;
  }
} 