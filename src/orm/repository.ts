import { Repository as TypeOrmRepository, EntityTarget, FindOptionsWhere, DeepPartial } from 'typeorm';
import { Database } from './database';
import { Entity } from './entity';
import { Logger } from '../utils/logger';

export abstract class Repository<T extends Entity> {
  protected readonly repository: TypeOrmRepository<T>;
  protected readonly logger: Logger;

  constructor(entity: EntityTarget<T>) {
    this.repository = Database.getInstance().getConnection().getRepository(entity);
    this.logger = new Logger();
  }

  async findAll(options?: FindOptionsWhere<T>): Promise<T[]> {
    try {
      return await this.repository.find({ where: options });
    } catch (error) {
      this.logger.error('Error finding entities:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<T | null> {
    try {
      return await this.repository.findOneBy({ id } as FindOptionsWhere<T>);
    } catch (error) {
      this.logger.error(`Error finding entity with id ${id}:`, error);
      throw error;
    }
  }

  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      const savedEntity = await this.repository.save(entity);
      return savedEntity;
    } catch (error) {
      this.logger.error('Error creating entity:', error);
      throw error;
    }
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    try {
      await this.repository.update(id, data as any);
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Error updating entity with id ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      this.logger.error(`Error deleting entity with id ${id}:`, error);
      throw error;
    }
  }

  async count(options?: FindOptionsWhere<T>): Promise<number> {
    try {
      return await this.repository.count({ where: options });
    } catch (error) {
      this.logger.error('Error counting entities:', error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ where: { id } as FindOptionsWhere<T> });
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking if entity with id ${id} exists:`, error);
      throw error;
    }
  }
} 