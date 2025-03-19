import { Command } from '../../core/decorators/command.decorator';
import { Database } from '../../orm/database';
import { Logger } from '../../utils/logger';

@Command({
  name: 'orm',
  description: 'Comandos para gestionar el ORM'
})
export class ORMCommand {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  @Command({
    name: 'migration:create',
    description: 'Crea una nueva migración',
    arguments: [
      { name: 'name', description: 'Nombre de la migración', required: true }
    ]
  })
  async createMigration(name: string) {
    try {
      const database = Database.getInstance();
      const connection = database.getConnection();
      
      await connection.runMigrations();
      this.logger.info(`Migración "${name}" creada exitosamente`);
    } catch (error) {
      this.logger.error('Error al crear la migración:', error);
      process.exit(1);
    }
  }

  @Command({
    name: 'migration:run',
    description: 'Ejecuta las migraciones pendientes'
  })
  async runMigrations() {
    try {
      const database = Database.getInstance();
      const connection = database.getConnection();
      
      await connection.runMigrations();
      this.logger.info('Migraciones ejecutadas exitosamente');
    } catch (error) {
      this.logger.error('Error al ejecutar las migraciones:', error);
      process.exit(1);
    }
  }

  @Command({
    name: 'migration:revert',
    description: 'Revierte la última migración ejecutada'
  })
  async revertMigration() {
    try {
      const database = Database.getInstance();
      const connection = database.getConnection();
      
      await connection.undoLastMigration();
      this.logger.info('Última migración revertida exitosamente');
    } catch (error) {
      this.logger.error('Error al revertir la migración:', error);
      process.exit(1);
    }
  }
} 