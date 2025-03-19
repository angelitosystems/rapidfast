import { exec, spawn } from 'child_process';
import { Logger } from '../../utils/logger';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import open from 'open';
// Las importaciones tipo se usarán sólo cuando sea necesario para evitar dependencias innecesarias

const execAsync = promisify(exec);

interface ServeOptions {
  port: string;
  host: string;
  watch: boolean;
  dev: boolean;
  prod: boolean;
}

// Interfaz para la respuesta de recarga de entorno
interface EnvReloadResponse {
  success: boolean;
  message?: string;
  variables?: string[];
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
      
      // Por defecto, usar un nivel de log menos verbose en el servidor para evitar tanto mensaje
      if (!process.env.LOG_LEVEL) {
        process.env.LOG_LEVEL = 'INFO';
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
      
      // Iniciar spinner con mensaje mejorado
      if (this.isFirstStart) {
        this.spinner.start(chalk.bold.cyan('🚀 Iniciando servidor RapidFAST...'));
      } else {
        this.spinner.start(chalk.bold.yellow('🔄 Reiniciando servidor...'));
      }
      
      // Ejecutar ts-node para iniciar el servidor
      const nodePath = await this.getNodePath();
      const tsNodePath = require.resolve('ts-node/dist/bin');
      
      // Configurar variables de entorno para el proceso hijo
      const env = { 
        ...process.env, 
        PORT: options.port, 
        HOST: options.host,
        // Marcar que estamos en modo CLI para poder personalizar salidas
        RAPIDFAST_CLI: 'true',
        // Asegurar que el entorno sea consistente
        NODE_ENV: process.env.NODE_ENV || 'development'
      };
      
      this.serverProcess = spawn(nodePath, [tsNodePath, './src/main.ts'], {
        stdio: ['inherit', 'inherit', 'inherit'],
        env
      });
      
      this.serverProcess.on('error', (err: Error) => {
        this.spinner.fail(chalk.bold.red('❌ Error al iniciar el servidor'));
        this.logger.error('Error:', err);
      });
      
      // Esperar un breve tiempo para asegurarse de que el servidor se inicie
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.spinner.succeed(this.isFirstStart ? 
        chalk.bold.green('✅ Servidor iniciado correctamente') : 
        chalk.bold.green('✅ Servidor reiniciado correctamente'));
      
      // Sólo mostrar el banner y abrir Swagger UI en la primera ejecución
      if (this.isFirstStart) {
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
      this.spinner.fail(chalk.bold.red('❌ Error al iniciar el servidor'));
      this.logger.error('Error:', error);
      throw error;
    }
  }
  
  private setupFileWatcher(options: ServeOptions): void {
    // Bandera para controlar si ya se mostró el mensaje de RapidWatch
    let watchReadyMessageShown = false;
    
    // Observar cambios en archivos de todo tipo, incluyendo .env y archivos de configuración
    const watcher = chokidar.watch([
      'src/**/*.*',                  // Todos los archivos dentro de src
      '.env',                       // Archivo .env en la raíz
      '.env.*',                     // Variantes de .env (.env.development, etc.)
      'config/**/*.*',              // Archivos de configuración
      'public/**/*.*',              // Archivos públicos
      'static/**/*.*',              // Archivos estáticos
      'templates/**/*.*'            // Plantillas
    ], {
      ignored: [
        '**/node_modules/**',       // Ignorar node_modules
        '**/.git/**',               // Ignorar .git
        '**/*.spec.ts',             // Ignorar archivos de prueba
        '**/*.test.ts',             // Ignorar archivos de prueba alternativos
        '**/dist/**',               // Ignorar carpeta de distribución
        '**/coverage/**'            // Ignorar carpeta de cobertura
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {           // Esperar a que termine de escribirse el archivo
        stabilityThreshold: 300,    // Esperar 300ms después de la última modificación
        pollInterval: 100           // Comprobar cada 100ms
      }
    });
    
    // Variable para registrar la última vez que se reinició el servidor
    // para evitar múltiples reinicios muy seguidos
    let lastRestart = Date.now();
    const debounceTime = 2000; // 2 segundos de espera entre reinicios
    
    // Contadores para mostrar un resumen de cambios
    const changeStats = {
      add: 0,
      change: 0,
      unlink: 0
    };

    // Función para mostrar el encabezado de la tabla de cambios con alineación perfecta
    const showFileChangesHeader = () => {
      const tableWidth = 76;
      const createLine = (char: string) => chalk.bold.cyan(char.repeat(tableWidth));
      const createHeaderLine = (left: string, middle: string, right: string) => 
        chalk.bold.cyan(left) + createLine(middle) + chalk.bold.cyan(right);
      
      const createRow = (content: string) => 
        chalk.bold.cyan('║') + content.padEnd(tableWidth - 2) + chalk.bold.cyan('║');
      
      const createDivider = (left: string, middle: string, separator: string, right: string) => 
        chalk.bold.cyan(left) + 
        chalk.bold.cyan(middle.repeat(11)) + 
        chalk.bold.cyan(separator) + 
        chalk.bold.cyan(middle.repeat(tableWidth - 15)) + 
        chalk.bold.cyan(right);
      
      console.log('\n' + createHeaderLine('╔', '═', '╗'));
      console.log(createRow(` ${chalk.bold.white('🔄 CAMBIOS DETECTADOS')}`));
      console.log(createDivider('╠', '═', '╦', '╣'));
      console.log(chalk.bold.cyan('║') + chalk.bold.white(' EVENTO    ') + 
                  chalk.bold.cyan('║') + chalk.bold.white(` ARCHIVO${' '.repeat(tableWidth - 21)}`) + 
                  chalk.bold.cyan('║'));
      console.log(createDivider('╠', '═', '╬', '╣'));
    };
    
    const handleFileChange = async (path: string, eventType: string) => {
      const now = Date.now();
      if (now - lastRestart < debounceTime) {
        return; // Ignorar cambios muy seguidos
      }
      
      // Identificar el tipo de archivo para mostrar mensajes más informativos
      const fileType = this.getFileType(path);
      
      // Incrementar contador de estadísticas
      if (eventType === 'nuevo') {
        changeStats.add++;
      } else if (eventType === 'cambio') {
        changeStats.change++;
      } else if (eventType === 'eliminado') {
        changeStats.unlink++;
      }
      
      // Mostrar cabecera de cambios detectados
      showFileChangesHeader();
      
      // Usar iconos más modernos y un formato más organizado
      let coloredType;
      switch (eventType) {
        case 'nuevo':
          coloredType = chalk.green(' NUEVO     ');
          break;
        case 'cambio':
          coloredType = chalk.yellow(' CAMBIO    ');
          break;
        case 'eliminado':
          coloredType = chalk.red(' ELIMINADO ');
          break;
        default:
          coloredType = chalk.blue(' OTRO      ');
      }
      
      // Truncar path si es muy largo
      let displayPath = path;
      const maxPathLength = 63; // Para mantener alineación perfecta
      if (path.length > maxPathLength) {
        const start = path.substring(0, Math.floor(maxPathLength/2) - 2);
        const end = path.substring(path.length - Math.floor(maxPathLength/2) + 1);
        displayPath = `${start}...${end}`;
      }
      
      console.log(chalk.bold.cyan('║') + coloredType + chalk.bold.cyan('║') + 
                 ` ${chalk.white(displayPath.padEnd(maxPathLength))}` + chalk.bold.cyan('║'));
      console.log(chalk.bold.cyan('╚════════════╩════════════════════════════════════════════════════════════════╝'));
      
      // Mensajes especiales y manejo diferente según el tipo de archivo
      if (path.endsWith('.env') || path.includes('.env.')) {
        console.log('\n' + chalk.cyan('🔧 ') + chalk.bold.white(`Detectados cambios en ${fileType}...`));
        console.log(chalk.yellow('⚡ ') + chalk.bold.white('Recargando variables de entorno...'));
        
        // Si hay cambios en el archivo .env, intentar notificar al servidor para una recarga más suave
        // en lugar de reiniciar por completo el servidor
        try {
          // Usar fetch nativo de Node.js (disponible a partir de Node.js 18)
          const reloadUrl = `http://${options.host}:${options.port}/_rapidfast/reload-env`;
          
          // Verificar si fetch está disponible nativamente
          if (typeof global.fetch === 'function') {
            const response = await fetch(reloadUrl, { 
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-RapidFAST-Reload': 'true'
              }
            })
            .then(async (res) => {
              if (!res.ok) {
                return { success: false, message: `Error: ${res.status} ${res.statusText}` } as EnvReloadResponse;
              }
              return await res.json() as EnvReloadResponse;
            })
            .catch((err: Error) => {
              // Si falla la petición (servidor no disponible o ruta no implementada), reiniciar normalmente
              return { success: false, message: err.message } as EnvReloadResponse;
            });
            
            if (response.success) {
              console.log(chalk.green('✅ ') + chalk.bold.white(`Variables de entorno actualizadas sin reinicio`));
              const varCount = response.variables?.length || 0;
              console.log(chalk.gray(`\n📊 Resumen: ${chalk.yellow(`${varCount} variables actualizadas`)}`));
              return; // Evitar reinicio completo si la recarga fue exitosa
            }
          } else {
            this.logger.debug('Fetch API no disponible nativamente, continuando con reinicio completo');
          }
        } catch (error) {
          // Si hay algún error, continuar con el reinicio completo
          this.logger.debug('No se pudo recargar solo las variables, reiniciando servidor:', error);
        }
      } else if (path.includes('config/')) {
        console.log('\n' + chalk.cyan('🔧 ') + chalk.bold.white(`Detectados cambios en ${fileType}...`));
      } else {
        console.log('\n' + chalk.cyan('⚡ ') + chalk.bold.white(`Reiniciando servidor debido a cambios en ${fileType}...`));
      }
      
      lastRestart = now;
      await this.startServer(options);
      
      // Mostrar resumen de cambios después del reinicio con mejor formato
      console.log(chalk.gray(`\n📊 Resumen: ${chalk.green(`${changeStats.add} añadidos`)}, ${chalk.yellow(`${changeStats.change} modificados`)}, ${chalk.red(`${changeStats.unlink} eliminados`)}`));
    };
    
    // Reemplazar el método de manejo de eventos con un objeto de mapeo
    const eventHandlers: Record<string, (path: string) => Promise<void>> = {
      'change': (path) => handleFileChange(path, 'cambio'),
      'add': (path) => handleFileChange(path, 'nuevo'),
      'unlink': (path) => handleFileChange(path, 'eliminado')
    };
    
    // Registrar los manejadores de eventos
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      watcher.on(event, handler);
    });
    
    // Mostrar mensajes informativos al iniciar la observación
    watcher.on('ready', () => {
      // Solo mostrar el mensaje si no se ha mostrado antes
      if (!watchReadyMessageShown) {
        watchReadyMessageShown = true;
        this.logger.info('👀 RapidWatch™ observando cambios en:');
        
        // Mostrar los patrones de observación en una lista bonita
        [
          'Archivos de código (src/**/*.*)',
          'Variables de entorno (.env, .env.*)',
          'Configuración (config/**/*.*)',
          'Archivos estáticos y públicos',
          'Plantillas (templates/**/*.*)'
        ].forEach(pattern => {
          this.logger.info(`   ${chalk.green('✓')} ${pattern}`);
        });
      }
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

  /**
   * Identifica el tipo de archivo basado en su extensión o ruta
   * @param filePath Ruta del archivo
   * @returns Descripción del tipo de archivo
   */
  private getFileType(filePath: string): string {
    // Primero verificar patrones especiales
    if (filePath.endsWith('.env') || filePath.includes('.env.')) {
      return 'variables de entorno';
    }
    
    if (filePath.includes('config/')) {
      return 'archivos de configuración';
    }
    
    // Luego verificar por extensión
    const extension = path.extname(filePath).toLowerCase();
    const fileTypes: Record<string, string> = {
      '.ts': 'código TypeScript',
      '.js': 'código JavaScript',
      '.json': 'datos JSON',
      '.css': 'estilos CSS',
      '.scss': 'estilos SCSS',
      '.html': 'plantilla HTML',
      '.md': 'documentación',
      '.yaml': 'configuración YAML',
      '.yml': 'configuración YAML',
      '.svg': 'gráficos SVG',
      '.png': 'imagen PNG',
      '.jpg': 'imagen JPG',
      '.jpeg': 'imagen JPEG',
      '.ico': 'icono',
      '.txt': 'archivo de texto'
    };
    
    return fileTypes[extension] || 'archivos';
  }
}