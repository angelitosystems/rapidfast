import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  Req,
  Res,
  Request,
  Response
} from '@angelitosystems/rapidfast';
import { AppService } from './app.service';
import { Mensaje, EstadoServidor } from './interfaces';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Req() req: Request, @Res() res: Response): Promise<Mensaje> {
    return this.appService.getHello();
  }

  @Get('estado')
  async getEstado(@Req() req: Request, @Res() res: Response): Promise<EstadoServidor> {
    return this.appService.getEstado();
  }

  @Post('mensaje')
  async createMensaje(
    @Body() mensaje: Mensaje,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Mensaje> {
    return this.appService.createMensaje(mensaje);
  }

  @Put('mensaje/:id')
  async updateMensaje(
    @Param('id') id: string,
    @Body() mensaje: Mensaje,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Mensaje> {
    return this.appService.updateMensaje(id, mensaje);
  }

  @Delete('mensaje/:id')
  async deleteMensaje(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    await this.appService.deleteMensaje(id);
  }
} 