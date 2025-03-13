import { Request, Response, NextFunction } from '../interfaces/http.interface';
import { RouteHandler, Controller as IController } from '../interfaces/controller.interface';

// Clase base para todos los controladores
export abstract class Controller {
  [key: string]: RouteHandler | any;

  // Métodos comunes que todos los controladores pueden usar
  protected send(res: Response, data: any, status: number = 200): void {
    res.status(status).json(data);
  }

  protected success<T>(data: T, message: string = 'Success'): { data: T; message: string } {
    return {
      data,
      message
    };
  }

  protected error(message: string, status: number = 400): { error: string; status: number } {
    return {
      error: message,
      status
    };
  }

  protected async handle(handler: RouteHandler): Promise<void> {
    try {
      await handler(this.req, this.res, this.next);
    } catch (error) {
      this.next(error);
    }
  }

  protected validate(schema: any): RouteHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await schema.validateAsync(req.body);
        next();
      } catch (error) {
        next(error);
      }
    };
  }
} 