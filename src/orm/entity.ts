import { Entity as TypeOrmEntity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@TypeOrmEntity()
export abstract class Entity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  toJSON(): Record<string, any> {
    const json: Record<string, any> = Object.assign({}, this);
    return json;
  }

  toString(): string {
    return `${this.constructor.name}#${this.id}`;
  }
} 