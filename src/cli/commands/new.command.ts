import { Logger } from '../../utils/logger';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';
import { execAsync } from '../../utils/exec';
import * as globCb from 'glob'; // Import the callback-based glob

const execAsyncPromisified = promisify(exec);
const glob = promisify(globCb.glob); // Promisify the glob function

interface NewCommandOptions {
  directory?: string;
  skipInstall?: boolean;
  packageManager?: string;
  database?: string;
}

interface DatabaseConfig {
  dependencies: Record<string, string>;
  type?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  url?: string;
}

interface ProjectAnswers {
  description: string;
  author: string;
  packageManager: string;
  'database.type': string;
  features: string[];
}

interface ProjectConfig {
  name: string;
  description: string;
  author: string;
  packageManager: string;
  'database.type': string;
  features: string[];
}

export class NewCommand {
  private readonly logger: Logger;
  private spinner: ReturnType<typeof ora>;
  private isLocal: boolean;

  constructor() {
    this.logger = new Logger();
    this.spinner = ora();
    this.isLocal = process.env.NODE_ENV === 'development' || process.env.RAPIDFAST_LOCAL === 'true';
  }

  private async checkPackageManager(pm: string): Promise<boolean> {
    try {
      await execAsync(`${pm} --version`);
      return true;
    } catch {
      return false;
    }
  }

  private async detectAvailablePackageManagers(): Promise<string[]> {
    const packageManagers = ['npm', 'yarn', 'pnpm'];
    const available = await Promise.all(
      packageManagers.map(async pm => ({
        name: pm,
        available: await this.checkPackageManager(pm),
      }))
    );
    return available.filter(pm => pm.available).map(pm => pm.name);
  }

  private async promptForProjectDetails(name: string): Promise<ProjectConfig> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Descripción del proyecto:',
        default: 'Un proyecto RapidFAST'
      },
      {
        type: 'input',
        name: 'author',
        message: 'Autor:',
        default: process.env.USER || process.env.USERNAME
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Gestor de paquetes:',
        choices: ['npm', 'yarn', 'pnpm'],
        default: 'npm'
      },
      {
        type: 'list',
        name: 'database.type',
        message: 'Tipo de base de datos:',
        choices: ['mongodb', 'mysql', 'postgres', 'sqlite'],
        default: 'mongodb'
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Características adicionales:',
        choices: [
          { name: 'Autenticación JWT', value: 'auth' },
          { name: 'Documentación Swagger', value: 'swagger' },
          { name: 'Sistema de caché', value: 'cache' },
          { name: 'Logging avanzado', value: 'logging' }
        ]
      }
    ]);

    return {
      name,
      ...answers,
      'database.type': answers['database.type']
    };
  }

  private async promptForDatabaseConfig(type: string): Promise<DatabaseConfig> {
    const config: DatabaseConfig = {
      dependencies: {}
    };

    switch (type) {
      case 'mongodb':
        config.dependencies['mongodb'] = '^6.0.0';
        break;
      case 'mysql':
        config.dependencies['mysql2'] = '^3.0.0';
        break;
      case 'postgres':
        config.dependencies['pg'] = '^8.0.0';
        break;
      case 'sqlite':
        config.dependencies['sqlite3'] = '^5.0.0';
        break;
    }

    return config;
  }

  private async getGitUser(): Promise<string> {
    try {
      const { stdout: name } = await execAsync('git config --get user.name');
      const { stdout: email } = await execAsync('git config --get user.email');
      return `${name.trim()} <${email.trim()}>`;
    } catch {
      return '';
    }
  }

  private async generatePackageJson(name: string, answers: ProjectAnswers): Promise<void> {
    const packageJson: any = {
      name,
      version: '0.0.1',
      description: answers.description,
      author: answers.author,
      scripts: {
        start: 'ts-node src/main.ts',
        build: 'tsc',
        dev: 'nodemon src/main.ts'
      },
      dependencies: {}
    };

    // Configurar dependencia de RapidFast
    if (this.isLocal) {
      // En modo local, usamos la ruta absoluta al paquete local
      const localPackagePath = path.resolve(__dirname, '../../..');
      this.logger.info(`Usando ruta absoluta para RapidFast: ${localPackagePath}`);
      packageJson.dependencies['@angelitosystems/rapidfast'] = `file:${localPackagePath}`;
    } else {
      // En modo normal, usamos la versión de npm
      packageJson.dependencies['@angelitosystems/rapidfast'] = '^1.0.0';
    }

    const dbConfig = await this.promptForDatabaseConfig(answers['database.type']);
    
    // Configurar base de datos
    if (dbConfig) {
      packageJson.dependencies = {
        ...packageJson.dependencies,
        typeorm: '^0.3.0',
        ...dbConfig.dependencies
      };
    }

    const projectPath = path.resolve(process.cwd(), name);
    await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  }

  private getDatabaseDependencies(dbType: string): Record<string, string> {
    const deps: Record<string, string> = {};

    switch (dbType) {
      case 'mongodb':
        deps['mongoose'] = '^7.5.0';
        deps['@types/mongoose'] = '^5.11.97';
        deps['mongodb'] = '^5.8.0';
        break;
      case 'mysql':
        deps['mysql2'] = '^3.9.1';
        deps['typeorm'] = '^0.3.20';
        break;
      case 'postgresql':
        deps['pg'] = '^8.11.3';
        deps['typeorm'] = '^0.3.20';
        break;
      case 'sqlite':
        deps['sqlite3'] = '^5.1.7';
        deps['typeorm'] = '^0.3.20';
        break;
    }

    return deps;
  }

  private getFeatureDependencies(features: string[]): Record<string, string> {
    const deps: Record<string, string> = {};

    // Dependencias base que siempre se incluyen
    deps['class-transformer'] = '^0.5.1';
    deps['class-validator'] = '^0.14.1';

    if (features.includes('auth')) {
      deps['jsonwebtoken'] = '^9.0.2';
      deps['@types/jsonwebtoken'] = '^9.0.3';
      deps['bcrypt'] = '^5.1.1';
      deps['@types/bcrypt'] = '^5.0.0';
    }

    if (features.includes('validation')) {
      deps['class-validator'] = '^0.14.1';
      deps['class-transformer'] = '^0.5.1';
    }

    if (features.includes('swagger')) {
      deps['@nestjs/swagger'] = '^7.1.12';
      deps['swagger-ui-express'] = '^5.0.0';
      deps['@types/swagger-ui-express'] = '^4.1.4';
    }

    if (features.includes('compression')) {
      deps['compression'] = '^1.7.4';
      deps['@types/compression'] = '^1.7.3';
    }

    if (features.includes('cache')) {
      deps['cache-manager'] = '^5.2.3';
    }

    if (features.includes('logging')) {
      deps['winston'] = '^3.10.0';
    }

    return deps;
  }

  private async generateEnvFile(config: any): Promise<void> {
    let envContent = `# Variables de entorno para ${config.name}\n\n`;
    envContent += `# Puerto del servidor\nPORT=3000\n\n`;
    
    // Configuración de base de datos
    envContent += `# Configuración de base de datos\n`;
    switch (config['database.type']) {
      case 'sqlite':
        envContent += `DB_FILE=database.sqlite\n\n`;
        break;
      default:
        envContent += `DB_HOST=localhost\n`;
        envContent += `DB_PORT=5432\n`;
        envContent += `DB_NAME=database\n`;
        envContent += `DB_USER=user\n`;
        envContent += `DB_PASS=password\n\n`;
    }

    // Configuración de características
    if (config.features?.includes('auth')) {
      envContent += `# Configuración de JWT\n`;
      envContent += `JWT_SECRET=cambiar_este_secreto\n`;
      envContent += `JWT_EXPIRES_IN=1h\n\n`;
    }

    if (config.features?.includes('cache')) {
      envContent += `# Configuración de caché\n`;
      envContent += `CACHE_TTL=300\n`;
      envContent += `CACHE_MAX=1000\n\n`;
    }

    // Configuración de CORS
    envContent += `# Configuración de CORS\n`;
    envContent += `CORS_ORIGIN=*\n`;

    await fs.writeFile(path.join(config.name, '.env'), envContent);
    await fs.writeFile(path.join(config.name, '.env.example'), envContent);
  }

  private async installDependencies(projectPath: string, packageManager: string): Promise<void> {
    try {
      const installCmd = packageManager === 'npm' ? 'install' : 'add';
      
      // Si estamos en desarrollo o se especificó --local
      if (this.isLocal) {
        try {
          // Primero construimos el paquete local
          this.spinner.text = 'Construyendo RapidFast local...';
          await execAsync('pnpm build', { cwd: path.resolve(__dirname, '../../..') });
          
          // Obtener la ruta absoluta del paquete local
          const localPackagePath = path.resolve(__dirname, '../../..');
          this.logger.info(`Usando RapidFast local desde: ${localPackagePath}`);
          
          // Instalamos dependencias según el gestor de paquetes
          this.spinner.text = 'Instalando dependencias...';
          switch (packageManager) {
            case 'pnpm':
              // Para pnpm, primero creamos el enlace global
              await execAsync('pnpm link --global', { cwd: localPackagePath });
              // Luego instalamos todo y enlazamos en el proyecto
              await execAsync(`cd "${projectPath}" && pnpm install && pnpm link --global @angelitosystems/rapidfast`);
              break;
              
            case 'yarn':
              // Para yarn, primero registramos el paquete
              await execAsync('yarn link', { cwd: localPackagePath });
              // Luego instalamos todo y enlazamos en el proyecto
              await execAsync(`cd "${projectPath}" && yarn install && yarn link @angelitosystems/rapidfast`);
              break;
              
            case 'npm':
              // Para npm, primero registramos el paquete
              await execAsync('npm link', { cwd: localPackagePath });
              // Luego instalamos todo y enlazamos en el proyecto
              await execAsync(`cd "${projectPath}" && npm install && npm link @angelitosystems/rapidfast`);
              break;
          }
          
          this.logger.info('RapidFast local enlazado correctamente');
        } catch (error) {
          this.logger.warn('Error al enlazar RapidFast local, usando versión de npm:', error);
          // Si falla el enlace, instalamos normalmente
          await execAsync(`cd "${projectPath}" && ${packageManager} ${installCmd}`);
        }
      } else {
        // Instalación normal desde npm
        await execAsync(`cd "${projectPath}" && ${packageManager} ${installCmd}`);
      }
    } catch (error) {
      throw new Error(`Error al instalar dependencias: ${error}`);
    }
  }

  private displayProjectInfo(config: ProjectConfig): void {
    const messages = [
      `\n${chalk.green('¡Proyecto creado exitosamente!')}`,
      '\nDetalles del proyecto:',
      `${chalk.cyan('Nombre:')} ${config.name}`,
      `${chalk.cyan('Descripción:')} ${config.description}`,
      `${chalk.cyan('Autor:')} ${config.author}`,
      `${chalk.cyan('Gestor de paquetes:')} ${config.packageManager}`,
      `${chalk.cyan('Base de datos:')} ${config['database.type']}`,
      `${chalk.cyan('Características adicionales:')} ${config.features.join(', ') || 'ninguna'}`,
    ];

    // Mostrar información sobre el paquete enlazado cuando se usa --local
    if (this.isLocal) {
      const localPackagePath = path.resolve(__dirname, '../../..');
      messages.push(
        `\n${chalk.yellow('Modo desarrollo:')} Usando RapidFAST local`,
        `${chalk.yellow('Ruta del paquete:')} ${localPackagePath}`
      );
    }

    messages.push(
      '\nPara comenzar:',
      `\n${chalk.cyan('cd')} ${config.name}`,
      `${chalk.cyan(`${config.packageManager} run dev`)}`,
      '\nEstructura del proyecto:',
      `${config.name}/`,
      '  ├── src/',
      '  │   ├── app/',
      '  │   │   ├── app.module.ts',
      '  │   │   ├── app.controller.ts',
      '  │   │   └── app.service.ts',
      '  │   └── main.ts',
      '  ├── .env',
      '  ├── .env.example',
      '  ├── package.json',
      '  └── tsconfig.json\n',
      `\n${chalk.yellow('¡No olvides configurar las variables de entorno en el archivo .env!')}`,
      `${chalk.yellow('Revisa la documentación para más información sobre las características seleccionadas.')}\n`,
    );

    console.log(messages.join('\n'));
  }

  private async copyTemplates(projectPath: string, projectName: string): Promise<void> {
    try {
      // Determinar la ruta de los templates
      let templatesPath: string;
      
      if (this.isLocal) {
        // En modo desarrollo, usar templates del proyecto actual
        templatesPath = path.resolve(__dirname, '../../../templates/project');
      } else {
        // En modo producción, usar templates del paquete instalado
        templatesPath = path.resolve(__dirname, '../../templates/project');
      }
      
      this.logger.info(`Copiando templates desde: ${templatesPath}`);
      
      if (!fs.existsSync(templatesPath)) {
        throw new Error(`No se encontró el directorio de templates: ${templatesPath}`);
      }
      
      // Copiar todos los archivos de template al proyecto
      await fs.copy(templatesPath, projectPath, {
        filter: (src: string) => {
          // Excluir archivos que no queremos copiar
          return !src.includes('node_modules') && !src.includes('.git');
        },
        overwrite: true,
        errorOnExist: false
      });
      
      this.logger.info(`Templates copiados a: ${projectPath}`);
      
      // Procesar y renombrar archivos
      await this.processTemplateFiles(projectPath, projectName);
      
    } catch (error) {
      throw new Error(`Error al copiar templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private async processTemplateFiles(projectPath: string, projectName: string): Promise<void> {
    try {
      // Buscar todos los archivos en el directorio del proyecto, incluyendo subdirectorios
      const files = await this.findAllFiles(projectPath);
      this.logger.info(`Procesando ${files.length} archivos de template`);
      
      for (const file of files) {
        try {
          const filePath = path.join(projectPath, file);
          
          // Leer el contenido del archivo
          const content = await fs.readFile(filePath, 'utf8');
          
          // Reemplazar variables en el contenido
          const processedContent = content
            .replace(/{{name}}/g, projectName)
            .replace(/{{projectName}}/g, projectName)
            .replace(/{{projectDescription}}/g, 'Proyecto creado con RapidFAST');
          
          // Guardar el archivo con el contenido procesado
          await fs.writeFile(filePath, processedContent);
          
          // Renombrar archivos .template
          if (file.endsWith('.template')) {
            const newPath = filePath.replace('.template', '');
            this.logger.info(`Renombrando: ${filePath} → ${newPath}`);
            
            // Asegurarse de que el archivo destino no exista para evitar errores
            if (await fs.pathExists(newPath)) {
              await fs.remove(newPath);
            }
            
            // Primero guarda el contenido en el nuevo archivo, luego elimina el original
            await fs.writeFile(newPath, processedContent);
            await fs.remove(filePath);
            
            this.logger.info(`Archivo renombrado exitosamente: ${path.basename(newPath)}`);
          }
        } catch (fileError) {
          this.logger.warn(`Error procesando archivo ${file}: ${fileError}`);
          // Continuar con el siguiente archivo
        }
      }
      
      this.logger.info('Procesamiento de templates completado');
    } catch (error) {
      throw new Error(`Error al procesar archivos de template: ${error}`);
    }
  }
  
  private async findAllFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = await fs.stat(itemPath);
      
      const relativePath = path.relative(dir, itemPath);
      
      if (stat.isDirectory()) {
        const subResults = await this.findAllFiles(itemPath);
        results = results.concat(subResults.map(p => path.join(relativePath, p)));
      } else {
        results.push(relativePath);
      }
    }
    
    return results;
  }

  public async execute(name: string, options: NewCommandOptions): Promise<void> {
    try {
      const projectPath = options.directory || path.join(process.cwd(), name);
      
      // Verificar si debemos sobrescribir
      const exists = await fs.pathExists(projectPath);
      if (exists) {
        const { overwrite } = await inquirer.prompt([{
          type: 'confirm',
          name: 'overwrite',
          message: `La carpeta ${projectPath} ya existe. ¿Deseas sobrescribir su contenido?`,
          default: false,
        }]);

        if (!overwrite) {
          this.logger.info('Operación cancelada por el usuario');
          return;
        }

        // Si existe y se aprobó sobrescribir, solo eliminamos los archivos dentro del directorio
        try {
          this.spinner.start('Limpiando archivos existentes...');
          // Eliminamos solo los archivos dentro del directorio, no el directorio en sí
          const files = await fs.readdir(projectPath);
          for (const file of files) {
            const filePath = path.join(projectPath, file);
            await fs.remove(filePath).catch(err => {
              this.logger.warn(`No se pudo eliminar ${filePath}: ${err.message}`);
            });
          }
          this.spinner.succeed('Archivos existentes eliminados exitosamente');
        } catch (error) {
          this.spinner.fail('Error al limpiar los archivos existentes');
          this.logger.warn('Continuando con la creación del proyecto...');
          // Continuamos con la creación del proyecto incluso si hay errores al limpiar
        }
      }

      // Obtener configuración del proyecto
      const answers = await this.promptForProjectDetails(name);
      
      this.spinner.start('Creando proyecto RapidFAST...');
      
      // Crear directorio del proyecto
      await fs.ensureDir(projectPath);
      
      // Copiar y procesar templates
      await this.copyTemplates(projectPath, name);
      
      // Generar archivos de configuración
      await this.generatePackageJson(name, answers);
      await this.generateEnvFile(answers);
      
      // Instalar dependencias
      if (!options.skipInstall) {
        this.spinner.text = 'Instalando dependencias...';
        await this.installDependencies(projectPath, answers.packageManager);
      }

      this.spinner.succeed('Proyecto creado exitosamente');
      
      this.displayProjectInfo({ ...answers, name });
    } catch (error) {
      this.spinner.fail('Error al crear el proyecto');
      this.logger.error('Error:', error);
      process.exit(1);
    }
  }
}
