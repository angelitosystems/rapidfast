import chalk from 'chalk';

// Definir los niveles de log
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export class Logger {
  private logLevel: LogLevel;
  private context: string;

  constructor(context: string = '') {
    this.context = context;
    // Configurar el nivel de log basado en variables de entorno
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLogLevel) {
      switch (envLogLevel) {
        case 'ERROR':
          this.logLevel = LogLevel.ERROR;
          break;
        case 'WARN':
          this.logLevel = LogLevel.WARN;
          break;
        case 'INFO':
          this.logLevel = LogLevel.INFO;
          break;
        case 'DEBUG':
          this.logLevel = LogLevel.DEBUG;
          break;
        default:
          this.logLevel = LogLevel.INFO;
      }
    } else {
      // Por defecto, en desarrollo mostramos hasta DEBUG, en producción hasta INFO
      this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatTimestamp(): string {
    const date = new Date();
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
  }

  private formatMessage(message: string): string {
    const timestamp = this.getTimestamp();
    const context = this.context ? `[${this.context}] ` : '';
    return `${timestamp} ${context}${message}`;
  }

  public info(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.log(this.formatMessage(message), ...args);
    }
  }

  public error(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(this.formatMessage(message), ...args);
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(this.formatMessage(message), ...args);
    }
  }

  public debug(message: string, ...args: any[]): void {
    // Solo mostrar mensajes de debug en modo desarrollo y si el nivel de log lo permite
    if (this.logLevel >= LogLevel.DEBUG && process.env.NODE_ENV === 'development') {
      // Si el mensaje contiene "//" o referencias a swagger y api-docs, no lo mostramos
      if (message.includes('//') || 
          (message.toLowerCase().includes('swagger') && !message.includes('Swagger UI')) ||
          message.toLowerCase().includes('api-docs')) {
        return;
      }
      
      console.debug(this.formatMessage(message), ...args);
    }
  }
} 