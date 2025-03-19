import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity as RepositoryBaseEntity } from './repository';

/**
 * Clase base para todas las entidades en la aplicación
 * Proporciona los campos id, createdAt y updatedAt
 */
export abstract class BaseEntity implements RepositoryBaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Métodos de utilidad para paginación
  static async paginate<T>(
    query: any,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Método para filtrado dinámico
  static applyFilters(query: any, filters: Record<string, any>): any {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.andWhere(`${key} = :${key}`, { [key]: value });
      }
    });
    return query;
  }
} 