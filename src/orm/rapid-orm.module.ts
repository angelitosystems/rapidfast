import { Module } from '../core/decorators/module.decorator';
import { Database } from './database';
import { ormConfig } from '../config/orm.config';
import { Logger } from '../utils/logger';

@Module({
  providers: [
    {
      provide: Database,
      useFactory: () => Database.getInstance()
    }
  ],
  exports: [Database]
})
export class RapidORMModule {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  async onModuleInit() {
    try {
      const database = Database.getInstance();
      await database.connect(ormConfig);
      this.logger.info('RapidORM initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize RapidORM:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      const database = Database.getInstance();
      await database.disconnect();
      this.logger.info('RapidORM disconnected successfully');
    } catch (error) {
      this.logger.error('Failed to disconnect RapidORM:', error);
      throw error;
    }
  }
} 