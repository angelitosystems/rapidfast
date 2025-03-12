import chokidar from 'chokidar';
import { Logger } from '../../utils/logger';
import { spawn } from 'child_process';
import path from 'path';
import ora from 'ora';
import boxen from 'boxen';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

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
  private watcher: chokidar.FSWatcher | null = null;
  private serverProcess: any = null;
  private spinner: ora.Ora;

  constructor() {
    this.logger = new Logger();
    this.spinner = ora({
      text: 'Iniciando servidor...',
      color: 'cyan',
    });
  }

  private async checkTsNode(): Promise<boolean> {
    try {
      await execAsync('ts-node --version');
      return true;
    } catch {
      return false;
    }
  }

  private async installTsNode(): Promise<void> {
    try {
      this.spinner.start('Instalando ts-node...');
      
      // Primero intentamos instalar globalmente
      try {
        await execAsync('npm install -g ts-node typescript @types/node');
        this.spinner.succeed('ts-node instalado correctamente');
        return;
      } catch (error) {
        this.logger.warn('No se pudo instalar ts-node globalmente, intentando localmente...');
      }

      // Si falla la instalación global, intentamos localmente
      await execAsync('npm install --save-dev ts-node typescript @types/node');
      this.spinner.succeed('ts-node instalado correctamente');
    } catch (error) {
      this.spinner.fail('Error al instalar ts-node');
      throw error;
    }
  }

  public async execute(options: ServeOptions): Promise<void> {
    try {
      process.env.NODE_ENV = options.prod ? 'production' : 'development';
      
      // Verificar si ts-node está instalado
      if (!await this.checkTsNode()) {
        this.spinner.info('ts-node no está instalado. Instalando...');
        await this.installTsNode();
      }

      if (options.watch) {
        this.logger.info('🔥 RapidWatch™ activado');
        await this.startWatcher();
      }

      await this.startServer(options);
      
      this.displayServerInfo(options);
    } catch (error) {
      this.logger.error('Error al iniciar el servidor:', error);
      process.exit(1);
    }
  }

  private async startWatcher(): Promise<void> {
    const watchPaths = [
      'src/**/*.ts',
      'src/**/*.js',
      'src/**/*.json',
    ];

    this.watcher = chokidar.watch(watchPaths, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
    });

    this.watcher
      .on('change', async (path) => {
        this.logger.info(`📝 Cambio detectado en: ${path}`);
        await this.restartServer();
      })
      .on('error', (error) => {
        this.logger.error('Error en RapidWatch™:', error);
      });
  }

  private async startServer(options: ServeOptions): Promise<void> {
    this.spinner.start();

    const serverFile = path.resolve(process.cwd(), 'src/main.ts');
    const tsNodePath = path.join(process.cwd(), 'node_modules', '.bin', 'ts-node');
    
    const env = {
      ...process.env,
      PORT: options.port,
      HOST: options.host,
    };

    // Intentar usar ts-node local primero
    if (require('fs').existsSync(tsNodePath)) {
      // En Windows, usamos comillas dobles para rutas con espacios
      if (process.platform === 'win32') {
        this.serverProcess = spawn(`"${tsNodePath}" "${serverFile}" --port ${options.port} --host ${options.host}`, [], {
          stdio: 'inherit',
          shell: true,
          env,
        });
      } else {
        this.serverProcess = spawn(tsNodePath, [
          serverFile,
          '--port', options.port,
          '--host', options.host,
        ], {
          stdio: 'inherit',
          shell: true,
          env,
        });
      }
    } else {
      // Si no existe localmente, usar el global
      if (process.platform === 'win32') {
        this.serverProcess = spawn(`ts-node "${serverFile}" --port ${options.port} --host ${options.host}`, [], {
          stdio: 'inherit',
          shell: true,
          env,
        });
      } else {
        this.serverProcess = spawn('ts-node', [
          serverFile,
          '--port', options.port,
          '--host', options.host,
        ], {
          stdio: 'inherit',
          shell: true,
          env,
        });
      }
    }

    this.serverProcess.on('error', (error: Error) => {
      this.spinner.fail();
      this.logger.error('Error al iniciar el servidor:', error);
    });

    this.spinner.succeed('Servidor iniciado');
  }

  private async restartServer(): Promise<void> {
    if (this.serverProcess) {
      this.spinner.start('Reiniciando servidor...');
      
      // En Windows usamos taskkill, en otros sistemas kill
      if (process.platform === 'win32' && this.serverProcess.pid) {
        try {
          spawn('taskkill', ['/pid', this.serverProcess.pid.toString(), '/f', '/t']);
        } catch (error) {
          this.logger.error('Error al detener el proceso:', error);
        }
      } else if (this.serverProcess.pid) {
        try {
          process.kill(this.serverProcess.pid);
        } catch (error) {
          this.logger.error('Error al detener el proceso:', error);
        }
      }

      // Esperar un momento para asegurarse de que el proceso se ha detenido
      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.startServer({
        port: process.env.PORT || '3000',
        host: process.env.HOST || 'localhost',
        watch: true,
        dev: process.env.NODE_ENV !== 'production',
        prod: process.env.NODE_ENV === 'production',
      });
    }
  }

  private displayServerInfo(options: ServeOptions): void {
    const serverInfo = [
      `${chalk.bold('🚀 Servidor RapidFAST en ejecución')}`,
      '',
      `${chalk.gray('Local:')}            ${chalk.cyan(`http://${options.host}:${options.port}`)}`,
      `${chalk.gray('Modo:')}             ${options.prod ? chalk.yellow('producción') : chalk.green('desarrollo')}`,
      `${chalk.gray('RapidWatch™:')}      ${options.watch ? chalk.green('activado') : chalk.yellow('desactivado')}`,
      '',
      `${chalk.gray('Presiona')} ${chalk.cyan('Ctrl+C')} ${chalk.gray('para detener')}`,
    ].join('\n');

    console.log(boxen(serverInfo, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    }));
  }
} 