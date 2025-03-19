import { Column, ColumnOptions } from './column';

export function PrimaryColumn(options: Omit<ColumnOptions, 'primary'> = {}): PropertyDecorator {
  return Column({
    ...options,
    primary: true,
  });
} 