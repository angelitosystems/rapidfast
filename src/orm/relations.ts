import 'reflect-metadata';
import { 
  OneToOne as TypeOrmOneToOne, 
  OneToMany as TypeOrmOneToMany, 
  ManyToOne as TypeOrmManyToOne, 
  ManyToMany as TypeOrmManyToMany, 
  JoinColumn as TypeOrmJoinColumn, 
  JoinTable as TypeOrmJoinTable,
  RelationOptions
} from 'typeorm';

// Re-exportar decoradores de relaciones
export { RelationOptions };
export const OneToOne = TypeOrmOneToOne;
export const OneToMany = TypeOrmOneToMany;
export const ManyToOne = TypeOrmManyToOne;
export const ManyToMany = TypeOrmManyToMany;
export const JoinColumn = TypeOrmJoinColumn;
export const JoinTable = TypeOrmJoinTable; 