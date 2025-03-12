import { Logger } from '../../utils/logger';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface NewCommandOptions {
  directory?: string;
  skipInstall?: boolean;
  packageManager?: string;
  database?: string;
}

interface DatabaseConfig {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  url?: string;
}

interface ProjectConfig {
  name: string;
  description: string;
  author: string;
  packageManager: string;
  database: {
    type: string;
    config: DatabaseConfig;
  };
  features: string[];
}

export class NewCommand {
  private readonly logger: Logger;
  private spinner: ora.Ora;

  constructor() {
    this.logger = new Logger();
    this.spinner = ora();
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
    const availableManagers = await this.detectAvailablePackageManagers();
    
    if (availableManagers.length === 0) {
      throw new Error('No se encontró ningún gestor de paquetes instalado (npm, yarn, pnpm)');
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Descripción del proyecto:',
        default: `Proyecto RapidFAST ${name}`,
      },
      {
        type: 'input',
        name: 'author',
        message: 'Autor del proyecto:',
        default: await this.getGitUser(),
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Selecciona el gestor de paquetes:',
        choices: availableManagers,
        default: availableManagers[0],
      },
      {
        type: 'list',
        name: 'database.type',
        message: 'Selecciona el motor de base de datos:',
        choices: [
          { name: 'MongoDB', value: 'mongodb' },
          { name: 'MySQL', value: 'mysql' },
          { name: 'PostgreSQL', value: 'postgresql' },
          { name: 'SQLite', value: 'sqlite' },
        ],
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Selecciona las características adicionales:',
        choices: [
          { name: 'Autenticación JWT', value: 'auth' },
          { name: 'Validación de datos', value: 'validation' },
          { name: 'Documentación OpenAPI', value: 'swagger' },
          { name: 'Compresión GZIP', value: 'compression' },
          { name: 'Caché', value: 'cache' },
          { name: 'Logging avanzado', value: 'logging' },
        ],
      },
    ]);

    // Configuración específica según la base de datos
    const dbConfig = await this.promptForDatabaseConfig(answers.database.type);
    
    return {
      name,
      ...answers,
      database: {
        type: answers.database.type,
        config: dbConfig,
      },
    };
  }

  private async promptForDatabaseConfig(dbType: string): Promise<DatabaseConfig> {
    let dbConfig: DatabaseConfig;

    switch (dbType) {
      case 'mongodb':
        const mongoAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'url',
            message: 'URL de conexión MongoDB:',
            default: 'mongodb://localhost:27017/rapidfast_db',
          },
        ]);
        dbConfig = {
          type: 'mongodb',
          url: mongoAnswers.url,
          host: 'localhost',
          port: 27017,
          database: 'rapidfast_db',
          username: '',
          password: '',
        };
        break;

      case 'mysql':
      case 'postgresql':
        const sqlAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'host',
            message: `Host de ${dbType}:`,
            default: 'localhost',
          },
          {
            type: 'input',
            name: 'port',
            message: `Puerto de ${dbType}:`,
            default: dbType === 'mysql' ? '3306' : '5432',
          },
          {
            type: 'input',
            name: 'database',
            message: 'Nombre de la base de datos:',
            default: 'rapidfast_db',
          },
          {
            type: 'input',
            name: 'username',
            message: 'Usuario:',
            default: dbType === 'mysql' ? 'root' : 'postgres',
          },
          {
            type: 'password',
            name: 'password',
            message: 'Contraseña:',
            mask: '*',
          },
        ]);
        dbConfig = {
          type: dbType,
          ...sqlAnswers,
          port: parseInt(sqlAnswers.port),
        };
        break;

      case 'sqlite':
        const sqliteAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'database',
            message: 'Nombre del archivo de base de datos:',
            default: 'database.sqlite',
          },
        ]);
        dbConfig = {
          type: 'sqlite',
          host: '',
          port: 0,
          username: '',
          password: '',
          database: sqliteAnswers.database,
        };
        break;

      default:
        throw new Error(`Motor de base de datos no soportado: ${dbType}`);
    }

    return dbConfig;
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

  private async generatePackageJson(config: ProjectConfig): Promise<void> {
    const packageJson = {
      name: config.name,
      version: '0.1.0',
      description: config.description,
      author: config.author,
      private: true,
      scripts: {
        dev: 'ts-node-dev --respawn --transpile-only src/main.ts',
        build: 'tsc',
        start: 'node dist/main.js',
        test: 'jest',
        lint: 'eslint "src/**/*.ts"',
        format: 'prettier --write "src/**/*.ts"',
      },
      dependencies: {
        '@angelitosystems/rapidfast': '^1.0.0',
        'dotenv': '^16.3.1',
        'reflect-metadata': '^0.1.13',
        ...this.getDatabaseDependencies(config.database.type),
        ...this.getFeatureDependencies(config.features),
      },
      devDependencies: {
        '@types/node': '^20.8.2',
        'typescript': '^5.2.2',
        '@types/jest': '^29.5.5',
        'jest': '^29.7.0',
        'ts-jest': '^29.1.1',
        'eslint': '^8.50.0',
        '@typescript-eslint/parser': '^6.7.4',
        '@typescript-eslint/eslint-plugin': '^6.7.4',
        'prettier': '^3.0.3',
        'ts-node-dev': '^2.0.0',
        'ts-node': '^10.9.1',
      },
    };

    await fs.writeJSON(path.join(config.name, 'package.json'), packageJson, { spaces: 2 });
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

  private async generateEnvFile(config: ProjectConfig): Promise<void> {
    const dbConfig = config.database.config;
    let envContent = `# Configuración del servidor
PORT=3000
HOST=localhost
NODE_ENV=development

# Configuración de la base de datos
DB_TYPE=${config.database.type}
`;

    switch (config.database.type) {
      case 'mongodb':
        envContent += `DB_URL=${dbConfig.url}\n`;
        break;
      case 'sqlite':
        envContent += `DB_FILE=${dbConfig.database}\n`;
        break;
      default:
        envContent += `DB_HOST=${dbConfig.host}
DB_PORT=${dbConfig.port}
DB_NAME=${dbConfig.database}
DB_USER=${dbConfig.username}
DB_PASS=${dbConfig.password}\n`;
    }

    if (config.features.includes('auth')) {
      envContent += `
# Configuración de JWT
JWT_SECRET=cambiar_este_secreto
JWT_EXPIRES_IN=1h\n`;
    }

    if (config.features.includes('cache')) {
      envContent += `
# Configuración de caché
CACHE_TTL=300
CACHE_MAX=1000\n`;
    }

    envContent += `
# Configuración de CORS
CORS_ORIGIN=*\n`;

    await fs.writeFile(path.join(config.name, '.env'), envContent);
    await fs.writeFile(path.join(config.name, '.env.example'), envContent);
  }

  private async generateFeatureFiles(config: ProjectConfig): Promise<void> {
    const srcPath = path.join(config.name, 'src');

    if (config.features.includes('auth')) {
      await this.generateAuthFiles(srcPath);
    }

    if (config.features.includes('swagger')) {
      await this.generateSwaggerConfig(srcPath);
    }

    if (config.features.includes('logging')) {
      await this.generateLoggingConfig(srcPath);
    }
  }

  private async generateAuthFiles(srcPath: string): Promise<void> {
    // TODO: Implementar generación de archivos de autenticación
  }

  private async generateSwaggerConfig(srcPath: string): Promise<void> {
    // TODO: Implementar generación de configuración Swagger
  }

  private async generateLoggingConfig(srcPath: string): Promise<void> {
    // TODO: Implementar generación de configuración de logging
  }

  private async copyTemplates(projectPath: string, name: string): Promise<void> {
    const templatesPath = path.join(__dirname, '../../../templates/project');
    
    if (!await fs.pathExists(templatesPath)) {
      throw new Error(`No se encontró el directorio de templates en: ${templatesPath}`);
    }
    
    await fs.copy(templatesPath, projectPath);
    
    // Procesar archivos .template
    const processTemplateFiles = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await processTemplateFiles(fullPath);
        } else if (entry.name.endsWith('.template')) {
          const newPath = fullPath.replace('.template', '');
          let content = await fs.readFile(fullPath, 'utf8');
          
          // Reemplazar variables en el contenido
          content = content.replace(/\{\{name\}\}/g, name);
          
          await fs.writeFile(newPath, content);
          await fs.remove(fullPath);
        }
      }
    };
    
    await processTemplateFiles(projectPath);
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
      }

      // Obtener configuración del proyecto
      const config = await this.promptForProjectDetails(name);
      
      this.spinner.start('Creando proyecto RapidFAST...');
      
      // Crear directorio del proyecto
      await fs.ensureDir(projectPath);
      
      // Copiar plantillas
      await this.copyTemplates(projectPath, name);
      
      // Generar archivos de configuración
      await this.generatePackageJson(config);
      await this.generateEnvFile(config);
      await this.generateFeatureFiles(config);
      
      // Instalar dependencias
      if (!options.skipInstall) {
        this.spinner.text = 'Instalando dependencias...';
        await this.installDependencies(projectPath, config.packageManager);
      }

      this.spinner.succeed('Proyecto creado exitosamente');
      
      this.displayProjectInfo(config);
    } catch (error) {
      this.spinner.fail('Error al crear el proyecto');
      this.logger.error('Error:', error);
      process.exit(1);
    }
  }

  private async installDependencies(projectPath: string, packageManager: string): Promise<void> {
    try {
      const installCmd = packageManager === 'npm' ? 'install' : 'add';
      await execAsync(`cd "${projectPath}" && ${packageManager} ${installCmd}`);
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
      `${chalk.cyan('Base de datos:')} ${config.database.type}`,
      `${chalk.cyan('Características adicionales:')} ${config.features.join(', ') || 'ninguna'}`,
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
    ].join('\n');

    console.log(messages);
  }
} 