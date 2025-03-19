import { Module } from '../decorators';
import { DataSource, DataSourceOptions, EntitySchema, ColumnType } from 'typeorm';
import { Provider, Type } from '../interfaces/module.interface';

interface DatabaseFeatureOptions {
  name: string;
  schema: Record<string, string>;
}

const typeMapping: Record<string, ColumnType> = {
  'string': 'varchar',
  'number': 'float',
  'boolean': 'boolean',
  'date': 'timestamp',
  'object': 'json',
};

export class DatabaseModule {
  private static dataSource: DataSource;

  static async initialize(options: DataSourceOptions) {
    this.dataSource = new DataSource(options);
    await this.dataSource.initialize();
    return this;
  }

  static forFeature(options: DatabaseFeatureOptions) {
    const repositoryToken = Symbol(`${options.name}Repository`);
    
    // Crear un proveedor para el repositorio
    const repositoryProvider: Provider = {
      provide: repositoryToken,
      useFactory: () => {
        const entity = this.createEntityFromSchema(options.name, options.schema);
        return this.dataSource.getRepository(entity);
      },
    };

    @Module({
      providers: [repositoryProvider],
      exports: [repositoryProvider],
    })
    class DynamicDatabaseFeatureModule {}

    return DynamicDatabaseFeatureModule;
  }

  private static createEntityFromSchema(name: string, schema: Record<string, string>): EntitySchema {
    const entitySchema = new EntitySchema({
      name,
      columns: Object.entries(schema).reduce((acc, [key, type]) => {
        acc[key] = { type: typeMapping[type.toLowerCase()] || 'varchar' };
        return acc;
      }, {} as Record<string, { type: ColumnType }>),
    });

    return entitySchema;
  }

  static getDataSource() {
    if (!this.dataSource) {
      throw new Error('Database not initialized. Call DatabaseModule.initialize() first.');
    }
    return this.dataSource;
  }
} 