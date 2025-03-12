import { Service as IService } from '../interfaces/service.interface';

export abstract class Service implements IService {
  public async onInit(): Promise<void> {
    // Hook para inicialización del servicio
  }

  public async onDestroy(): Promise<void> {
    // Hook para limpieza del servicio
  }

  protected async handleError(error: unknown): Promise<never> {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }

  protected async validate<T>(data: T, schema: any): Promise<T> {
    try {
      return await schema.validateAsync(data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Validation error: ${error.message}`);
      }
      throw new Error('Validation error: Unknown error occurred');
    }
  }
} 