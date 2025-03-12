import { Injectable } from '@angelitosystems/rapidfast';
import { Mensaje, EstadoServidor } from './interfaces';
import * as os from 'os';

@Injectable()
export class AppService {
  private mensajes: Map<string, Mensaje>;
  private startTime: number;

  constructor() {
    this.mensajes = new Map();
    this.startTime = Date.now();
  }

  async getHello(): Promise<Mensaje> {
    return {
      contenido: '¡Bienvenido a tu aplicación RapidFAST!',
      autor: 'Sistema',
      fecha: new Date()
    };
  }

  async getEstado(): Promise<EstadoServidor> {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      estado: 'activo',
      uptime: process.uptime(),
      memoria: {
        total: totalMem,
        usado: usedMem,
        libre: freeMem
      },
      version: process.version
    };
  }

  async createMensaje(mensaje: Mensaje): Promise<Mensaje> {
    const id = Date.now().toString();
    const nuevoMensaje = {
      ...mensaje,
      id,
      fecha: new Date()
    };

    this.mensajes.set(id, nuevoMensaje);
    return nuevoMensaje;
  }

  async updateMensaje(id: string, mensaje: Partial<Mensaje>): Promise<Mensaje> {
    const mensajeExistente = this.mensajes.get(id);
    if (!mensajeExistente) {
      throw new Error('Mensaje no encontrado');
    }

    const mensajeActualizado = {
      ...mensajeExistente,
      ...mensaje,
      id
    };

    this.mensajes.set(id, mensajeActualizado);
    return mensajeActualizado;
  }

  async deleteMensaje(id: string): Promise<void> {
    if (!this.mensajes.has(id)) {
      throw new Error('Mensaje no encontrado');
    }

    this.mensajes.delete(id);
  }
} 