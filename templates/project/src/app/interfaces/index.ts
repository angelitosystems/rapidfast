export interface Mensaje {
  id?: string;
  contenido: string;
  autor: string;
  fecha: Date;
}

export interface EstadoServidor {
  estado: 'activo' | 'inactivo';
  uptime: number;
  memoria: {
    total: number;
    usado: number;
    libre: number;
  };
  version: string;
} 