import { exec, spawn } from 'child_process';
import { Logger } from '../../utils/logger';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import open from 'open';

const execAsync = promisify(exec);

interface ServeOptions {
  port: string;
  host: string;
  watch: boolean;
  dev: boolean;
  prod: boolean;
}

export class ServeCommand {
  private readonly logger: Logger;
  private spinner: ReturnType<typeof ora>;
  private serverProcess: any = null;
  private isFirstStart = true; // Flag para rastrear si es el primer inicio
  private watchProcess: any = null;

  constructor() {
    this.logger = new Logger();
    this.spinner = ora();
  }

  public async execute(options: ServeOptions): Promise<void> {
    try {
      // Configurar NODE_ENV según las opciones
      if (options.prod) {
        process.env.NODE_ENV = 'production';
      } else if (options.dev) {
        process.env.NODE_ENV = 'development';
      }
      
      // Iniciar el servidor
      await this.startServer(options);
      
      // Si se activó RapidWatch, configurar observador de archivos
      if (options.watch) {
        this.logger.info('🔥 RapidWatch™ activado');
        this.setupFileWatcher(options);
      }
    } catch (error) {
      this.spinner.fail('Error al iniciar el servidor');
      this.logger.error('Error:', error);
      process.exit(1);
    }
  }

  private async startServer(options: ServeOptions): Promise<void> {
    try {
      // Detener el proceso anterior si existe
      if (this.serverProcess) {
        this.serverProcess.kill('SIGTERM');
        this.serverProcess = null;
      }
      
      // Iniciar spinner
      if (this.isFirstStart) {
        this.spinner.start('Iniciando servidor...');
      } else {
        this.spinner.start('Reiniciando servidor...');
      }
      
      // Ejecutar ts-node para iniciar el servidor
      const nodePath = await this.getNodePath();
      const tsNodePath = require.resolve('ts-node/dist/bin');
      
      const env = { ...process.env, PORT: options.port, HOST: options.host };
      
      this.serverProcess = spawn(nodePath, [tsNodePath, './src/main.ts'], {
        stdio: ['inherit', 'inherit', 'inherit'],
        env
      });
      
      this.serverProcess.on('error', (err: Error) => {
        this.spinner.fail('Error al iniciar el servidor');
        this.logger.error('Error:', err);
      });
      
      // Esperar un breve tiempo para asegurarse de que el servidor se inicie
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.spinner.succeed('Servidor iniciado');
      
      // Sólo mostrar el banner y abrir Swagger UI en la primera ejecución
      if (this.isFirstStart) {
        console.log(`Servidor iniciado en http://${options.host}:${options.port}`);
        
        // Abrir navegador con Swagger UI
        this.logger.info('🚀 Abriendo Swagger UI en el navegador...');
        try {
          // Usar try-catch adicional para manejar posibles errores con 'open'
          await open(`http://${options.host}:${options.port}/api-docs`).catch(err => {
            this.logger.warn('Error al abrir el navegador:', err);
          });
        } catch (err) {
          this.logger.warn('No se pudo abrir el navegador automáticamente');
        }
        
        // Ya no es el primer inicio
        this.isFirstStart = false;
      }
    } catch (error) {
      this.spinner.fail('Error al iniciar el servidor');
      this.logger.error('Error:', error);
      throw error;
    }
  }
  
  private setupFileWatcher(options: ServeOptions): void {
    // Observar cambios en archivos TypeScript y reiniciar el servidor cuando cambien
    const watcher = chokidar.watch(['src/**/*.ts', 'src/**/*.js'], {
      ignored: /node_modules|\.git|\.spec\.ts$/,
      persistent: true,
      ignoreInitial: true,
    });
    
    watcher.on('change', async (path) => {
      this.logger.info(`📁 Archivo modificado: ${path}`);
      await this.startServer(options);
    });
    
    watcher.on('add', async (path) => {
      this.logger.info(`📄 Nuevo archivo: ${path}`);
      await this.startServer(options);
    });
    
    // Guardar referencia al proceso de observación
    this.watchProcess = watcher;
  }
  
  private async getNodePath(): Promise<string> {
    try {
      const { stdout } = await execAsync('which node || where node');
      return stdout.trim();
    } catch (error) {
      // Si no se puede encontrar el comando, usar 'node' y confiar en PATH
      return 'node';
    }
  }
  
  public cleanup(): void {
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    
    if (this.watchProcess) {
      this.watchProcess.close();
    }
  }
}