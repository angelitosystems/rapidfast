import { Request, Response, NextFunction } from '../interfaces/http.interface';
import { Controller as IController, RouteHandler } from '../interfaces/controller.interface';

export abstract class Controller implements IController {
  protected req!: Request;
  protected res!: Response;
  protected next!: NextFunction;

  protected setContext(req: Request, res: Response, next: NextFunction): void {
    this.req = req;
    this.res = res;
    this.next = next;
  }

  protected success<T>(data: T, message: string = 'Success'): void {
    this.res.json({
      success: true,
      message,
      data,
    });
  }

  protected error(message: string, statusCode: number = 400): void {
    this.res.status(statusCode).json({
      success: false,
      message,
    });
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