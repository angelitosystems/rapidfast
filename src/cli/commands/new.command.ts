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
const globPromise = promisify(globCb.glob); // Promisify the glob function correctly

interface NewCommandOptions {
  directory?: string;
  skipInstall?: boolean;
  packageManager?: string;
  database?: string;
  local?: boolean;
}

interface DatabaseConfig {
  dependencies: Record<string, string>;
  type?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  mysqlConfig?: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    createDatabase?: boolean;
  };
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
  private databaseConfig: DatabaseConfig | undefined;

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
    this.databaseConfig = {
      dependencies: {}
    };

    switch (type) {
      case 'mongodb':
        this.databaseConfig.dependencies['mongodb'] = '^6.0.0';
        break;
      case 'mysql':
        this.databaseConfig.dependencies['mysql2'] = '^3.0.0';
        // Preguntar por la configuración de MySQL
        const mysqlConfig = await inquirer.prompt([
          {
            type: 'input',
            name: 'host',
            message: 'Host de MySQL:',
            default: 'localhost'
          },
          {
            type: 'input',
            name: 'port',
            message: 'Puerto de MySQL:',
            default: '3306',
            validate: (input: string) => !isNaN(Number(input)) || 'El puerto debe ser un número'
          },
          {
            type: 'input',
            name: 'username',
            message: 'Usuario de MySQL:',
            default: 'root'
          },
          {
            type: 'password',
            name: 'password',
            message: 'Contraseña de MySQL:',
            mask: '*'
          },
          {
            type: 'input',
            name: 'database',
            message: 'Nombre de la base de datos:',
            default: 'rapidfast_db'
          },
          {
            type: 'confirm',
            name: 'createDatabase',
            message: '¿Desea crear la base de datos automáticamente?',
            default: true
          }
        ]);
        this.databaseConfig.mysqlConfig = mysqlConfig;
        break;
      case 'postgres':
        this.databaseConfig.dependencies['pg'] = '^8.0.0';
        break;
      case 'sqlite':
        this.databaseConfig.dependencies['sqlite3'] = '^5.0.0';
        break;
    }

    return this.databaseConfig;
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
    try {
      const projectPath = path.resolve(process.cwd(), name);
      
      // Verificar si existe una plantilla de package.json
      let packageJson: any;
      const templatePath = path.join(projectPath, 'package.json.template');
      
      if (await fs.pathExists(templatePath)) {
        // Usar la plantilla si existe
        this.logger.info(`Usando plantilla de package.json desde: ${templatePath}`);
        const templateContent = await fs.readFile(templatePath, 'utf8');
        const processedContent = templateContent
          .replace(/{{projectName}}/g, name)
          .replace(/{{projectDescription}}/g, answers.description || 'Proyecto creado con RapidFAST Framework')
          .replace(/{{databaseType}}/g, answers['database.type'] || 'mysql');
          
        packageJson = JSON.parse(processedContent);
        
        // Actualizar el autor y tipo de base de datos
        packageJson.author = answers.author || '';
        packageJson.database = { type: answers['database.type'] || 'mysql' };
        
        // Eliminar la plantilla después de usarla
        await fs.remove(templatePath);
      } else {
        // Crear un package.json desde cero
        packageJson = {
          name,
          version: '0.0.1',
          description: answers.description || 'Proyecto creado con RapidFAST Framework',
          author: answers.author || '',
          main: 'dist/main.js',
          scripts: {
            start: 'node dist/main.js',
            build: 'tsc',
            dev: 'ts-node-dev --respawn --transpile-only src/main.ts',
            test: 'jest',
            lint: 'eslint . --ext .ts',
            format: 'prettier --write "src/**/*.ts"'
          },
          keywords: [],
          license: 'ISC',
          dependencies: {
            '@angelitosystems/rapidfast': '^1.0.6-beta.13',
            'reflect-metadata': '^0.2.1',
            'uuid': '^9.0.1'
          },
          devDependencies: {
            '@types/node': '^20.11.24',
            '@types/jest': '^29.5.12',
            '@types/uuid': '^9.0.7',
            '@typescript-eslint/eslint-plugin': '^7.1.0',
            '@typescript-eslint/parser': '^7.1.0',
            'eslint': '^8.57.0',
            'jest': '^29.7.0',
            'prettier': '^3.2.5',
            'ts-jest': '^29.1.2',
            'ts-node-dev': '^2.0.0',
            'typescript': '^5.3.3'
          }
        };
      }

      // Configurar dependencia de RapidFast
      if (this.isLocal) {
        // En modo local, usamos la ruta absoluta al paquete local
        const localPackagePath = path.resolve(__dirname, '../../..');
        this.logger.info(`Usando ruta absoluta para RapidFast: ${localPackagePath}`);
        packageJson.dependencies['@angelitosystems/rapidfast'] = `file:${localPackagePath}`;
      }

      // Configurar base de datos
      if (answers['database.type']) {
        const dbDependencies = this.getDatabaseDependencies(answers['database.type']);
        packageJson.dependencies = {
          ...packageJson.dependencies,
          'typeorm': '^0.3.0',
          ...dbDependencies
        };
      }

      // Agregar dependencias para características adicionales
      if (answers.features && answers.features.length > 0) {
        const featureDependencies = this.getFeatureDependencies(answers.features);
        packageJson.dependencies = {
          ...packageJson.dependencies,
          ...featureDependencies
        };
      }

      // Escribir el package.json
      await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
      this.logger.info(`✅ Archivo package.json creado en: ${path.join(projectPath, 'package.json')}`);
    } catch (error) {
      this.logger.error('Error al generar package.json:', error);
      throw error;
    }
  }

  private getDatabaseDependencies(dbType: string): Record<string, string> {
    const databaseDependenciesMap: Record<string, Record<string, string>> = {
      'mongodb': {
        'mongoose': '^7.5.0',
        '@types/mongoose': '^5.11.97',
        'mongodb': '^5.8.0'
      },
      'mysql': {
        'mysql2': '^3.9.1',
        'typeorm': '^0.3.20'
      },
      'postgresql': {
        'pg': '^8.11.3',
        'typeorm': '^0.3.20'
      },
      'sqlite': {
        'sqlite3': '^5.1.7',
        'typeorm': '^0.3.20'
      }
    };

    return databaseDependenciesMap[dbType] || {};
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
    try {
      // Determinar la ruta base de los templates
      const getTemplatesBasePath = () => {
        // Si estamos en modo desarrollo (src)
        if (__dirname.includes('src')) {
          return path.resolve(__dirname, '../../../templates');
        }
        // Si estamos en modo producción (dist)
        return path.resolve(__dirname, '../../templates');
      };

      // Obtener la ruta al archivo env.example de las plantillas
      const templatesBasePath = getTemplatesBasePath();
      const envExamplePath = path.join(templatesBasePath, 'project/.env.example.template');
      const envExamplePathAlt = path.join(templatesBasePath, 'project/.env.example');
      
      // Verificar si existe el archivo env.example
      let envExampleContent = '';
      if (fs.existsSync(envExamplePath)) {
        envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
      } else if (fs.existsSync(envExamplePathAlt)) {
        envExampleContent = fs.readFileSync(envExamplePathAlt, 'utf8');
      } else {
        this.logger.warn('⚠️ No se encontró la plantilla env.example. Generando .env con valores predeterminados...');
        
        let envContent = `# Variables de entorno para ${config.name}\n\n`;

        envContent += `APP_NAME=${config.name}\n`;
        envContent += `APP_DESCRIPTION=${config.description}\n`;
        envContent += `APP_VERSION=1.0.0\n`;
        envContent += `APP_AUTHOR=${config.author}\n`;
        envContent += `APP_ENV=development\n`;
        envContent += `APP_PORT=3000\n`;
        envContent += `APP_HOST=localhost\n`;
        
        envContent += `# Entorno de desarrollo\nNODE_ENV=development\n\n`;

        // Configuración de base de datos
        envContent += `# Configuración de base de datos\n`;
        
        const dbConfigMap: Record<string, string> = {
          'sqlite': `DB_FILE=database.sqlite\n\n`,
          'default': `DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=database\nDB_USER=user\nDB_PASS=password\n\n`
        };
        
        envContent += dbConfigMap[config['database.type']] || dbConfigMap['default'];

        // Configuración de características
        if (config.features?.includes('auth')) {
          envContent += `# Configuración de JWT\n`;
          envContent += `JWT_SECRET=${this.generateRandomSecret()}\n`;
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

        // Guardar archivos
        const envFilePath = path.join(process.cwd(), config.name, '.env');
        await fs.writeFile(envFilePath, envContent);
        this.logger.info(`✅ Archivo .env creado en: ${envFilePath}`);
        
        // Copia para .env.example con los mismos valores sin secretos
        envExampleContent = envContent
          .replace(/JWT_SECRET=.*/g, 'JWT_SECRET=your-secret-key');
        
        const envExampleFilePath = path.join(process.cwd(), config.name, '.env.example');
        await fs.writeFile(envExampleFilePath, envExampleContent);
        this.logger.info(`✅ Archivo .env.example creado en: ${envExampleFilePath}`);
      }
    } catch (error) {
      this.logger.error('Error al generar archivos .env:', error);
      throw error;
    }
  }
  
  /**
   * Genera una cadena aleatoria para usar como secreto JWT
   */
  private generateRandomSecret(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private async createMySQLDatabase(config: DatabaseConfig): Promise<void> {
    if (!config.mysqlConfig?.createDatabase || !config.mysqlConfig?.database) {
      return;
    }

    try {
      this.spinner.text = 'Creando base de datos MySQL...';
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: config.mysqlConfig.host,
        port: config.mysqlConfig.port,
        user: config.mysqlConfig.username,
        password: config.mysqlConfig.password
      });

      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.mysqlConfig.database}\`;`);
      await connection.end();
      this.logger.info(`✅ Base de datos '${config.mysqlConfig.database}' creada exitosamente`);
    } catch (error) {
      this.logger.error('Error al crear la base de datos MySQL:', error);
      throw error;
    }
  }

  private async runMigrations(projectPath: string, packageManager: string): Promise<void> {
    try {
      this.spinner.text = 'Ejecutando migraciones...';
      const migrationCommand = `${packageManager} run typeorm migration:run`;
      await execAsync(`cd "${projectPath}" && ${migrationCommand}`);
      this.logger.info('✅ Migraciones ejecutadas exitosamente');
    } catch (error) {
      this.logger.warn('No se pudieron ejecutar las migraciones:', error);
    }
  }

  private async installDependencies(projectPath: string, packageManager: string): Promise<void> {
    try {
      // Comandos de instalación para diferentes gestores de paquetes
      const installCommands = {
        npm: 'npm install',
        yarn: 'yarn install',
        pnpm: 'pnpm install'
      };
      
      this.spinner.text = 'Instalando dependencias...';
      this.logger.info(`Instalando dependencias en: ${projectPath}`);
      
      // Si estamos en modo local
      if (this.isLocal) {
        try {
          // Primero construimos el paquete local
          this.spinner.text = 'Construyendo RapidFast local...';
          await execAsync('pnpm build', { cwd: path.resolve(__dirname, '../../..') });
          
          // Obtener la ruta absoluta del paquete local
          const localPackagePath = path.resolve(__dirname, '../../..');
          this.logger.info(`Usando RapidFast local desde: ${localPackagePath}`);
          
          // Instalar todas las dependencias del package.json
          await execAsync(`cd "${projectPath}" && ${installCommands[packageManager as keyof typeof installCommands] || installCommands.npm}`);
          
          // Después de la instalación, enlazar la versión local de RapidFast
          switch (packageManager) {
            case 'pnpm':
              await execAsync('pnpm link --global', { cwd: localPackagePath });
              await execAsync(`cd "${projectPath}" && pnpm link --global @angelitosystems/rapidfast`);
              break;
              
            case 'yarn':
              await execAsync('yarn link', { cwd: localPackagePath });
              await execAsync(`cd "${projectPath}" && yarn link @angelitosystems/rapidfast`);
              break;
              
            case 'npm':
              await execAsync('npm link', { cwd: localPackagePath });
              await execAsync(`cd "${projectPath}" && npm link @angelitosystems/rapidfast`);
              break;
          }
          
          this.logger.info('RapidFast local enlazado correctamente');
        } catch (error) {
          this.logger.warn('Error al enlazar RapidFast local, usando versión de npm:', error);
          // Instalación normal si falla el enlace
          await execAsync(`cd "${projectPath}" && ${installCommands[packageManager as keyof typeof installCommands] || installCommands.npm}`);
        }
      } else {
        // Instalación normal, todas las dependencias declaradas en package.json
        await execAsync(`cd "${projectPath}" && ${installCommands[packageManager as keyof typeof installCommands] || installCommands.npm}`);
      }
      
      // Verificar si todas las dependencias se han instalado correctamente
      this.spinner.text = 'Verificando instalación de dependencias...';

      // Si es MySQL y se solicitó crear la base de datos, crearla
      if (this.databaseConfig?.mysqlConfig?.createDatabase) {
        await this.createMySQLDatabase(this.databaseConfig);
      }

      // Ejecutar migraciones si es necesario
      if (this.databaseConfig?.type === 'mysql') {
        await this.runMigrations(projectPath, packageManager);
      }
      try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const packageJson = await fs.readJson(packageJsonPath);
        
        // Verificar dependencias y devDependencies
        const missingDeps = await this.checkMissingDependencies(projectPath, packageJson);
        
        // Reinstalar dependencias faltantes si hay alguna
        if (missingDeps.length > 0) {
          this.logger.warn(`Reinstalando dependencias faltantes: ${missingDeps.join(', ')}`);
          
          // Comandos para instalar dependencias específicas
          const installSpecificCommands = {
            npm: 'npm install',
            yarn: 'yarn add',
            pnpm: 'pnpm add'
          };
          
          await execAsync(`cd "${projectPath}" && ${installSpecificCommands[packageManager as keyof typeof installSpecificCommands] || installSpecificCommands.npm} ${missingDeps.join(' ')}`);
        } else {
          this.logger.info('Todas las dependencias instaladas correctamente');
        }
      } catch (error) {
        this.logger.warn('Error al verificar dependencias:', error);
      }
    } catch (error) {
      throw new Error(`Error al instalar dependencias: ${error}`);
    }
  }
  
  // Método para verificar dependencias faltantes
  private async checkMissingDependencies(projectPath: string, packageJson: any): Promise<string[]> {
    const missingDeps: string[] = [];
    
    // Función para verificar un conjunto de dependencias
    const checkDeps = async (depsObj: Record<string, string> | undefined): Promise<void> => {
      if (!depsObj) return;
      
      for (const [dep, version] of Object.entries(depsObj)) {
        try {
          // Verificar si la dependencia existe en node_modules
          const depPath = path.join(projectPath, 'node_modules', dep);
          if (!await fs.pathExists(depPath)) {
            missingDeps.push(`${dep}@${version}`);
          }
        } catch (err) {
          missingDeps.push(`${dep}@${version}`);
        }
      }
    };
    
    // Verificar dependencias normales y de desarrollo
    await checkDeps(packageJson.dependencies);
    await checkDeps(packageJson.devDependencies);
    
    return missingDeps;
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
      '  │   ├── config/',
      '  │   │   └── swagger.config.ts',
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
      // Determinar la ruta base de los templates
      const getTemplatesBasePath = () => {
        // Si estamos en modo desarrollo (src)
        if (__dirname.includes('src')) {
          return path.resolve(__dirname, '../../../templates');
        }
        // Si estamos en modo producción (dist)
        return path.resolve(__dirname, '../../templates');
      };

      // Obtener la ruta al archivo env.example de las plantillas
      const templatesBasePath = getTemplatesBasePath();
      const envExamplePath = path.join(templatesBasePath, 'project/.env.example.template');
      const envExamplePathAlt = path.join(templatesBasePath, 'project/.env.example');
      
      // Verificar si existe el archivo env.example
      let envExampleContent = '';
      if (fs.existsSync(envExamplePath)) {
        envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
      } else if (fs.existsSync(envExamplePathAlt)) {
        envExampleContent = fs.readFileSync(envExamplePathAlt, 'utf8');
      } else {
        this.logger.warn('⚠️ No se encontró la plantilla env.example. Generando .env con valores predeterminados...');
        
        let envContent = `# Variables de entorno para ${projectName}\n\n`;

        envContent += `APP_NAME=${projectName}\n`;
        envContent += `APP_DESCRIPTION=${projectName}\n`;
        envContent += `APP_VERSION=1.0.0\n`;
        envContent += `APP_AUTHOR=${projectName}\n`;
        envContent += `APP_ENV=development\n`;
        envContent += `APP_PORT=3000\n`;
        envContent += `APP_HOST=localhost\n`;
        
        envContent += `# Entorno de desarrollo\nNODE_ENV=development\n\n`;

        // Configuración de base de datos
        envContent += `# Configuración de base de datos\n`;
        
        const dbConfigMap: Record<string, string> = {
          'sqlite': `DB_FILE=database.sqlite\n\n`,
          'default': `DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=database\nDB_USER=user\nDB_PASS=password\n\n`
        };
        
        envContent += dbConfigMap[projectName] || dbConfigMap['default'];

        // Configuración de características
        if (projectName.includes('auth')) {
          envContent += `# Configuración de JWT\n`;
          envContent += `JWT_SECRET=${this.generateRandomSecret()}\n`;
          envContent += `JWT_EXPIRES_IN=1h\n\n`;
        }

        if (projectName.includes('cache')) {
          envContent += `# Configuración de caché\n`;
          envContent += `CACHE_TTL=300\n`;
          envContent += `CACHE_MAX=1000\n\n`;
        }

        // Configuración de CORS
        envContent += `# Configuración de CORS\n`;
        envContent += `CORS_ORIGIN=*\n`;

        // Guardar archivos
        const envFilePath = path.join(process.cwd(), projectName, '.env');
        await fs.writeFile(envFilePath, envContent);
        this.logger.info(`✅ Archivo .env creado en: ${envFilePath}`);
        
        // Copia para .env.example con los mismos valores sin secretos
        envExampleContent = envContent
          .replace(/JWT_SECRET=.*/g, 'JWT_SECRET=your-secret-key');
        
        const envExampleFilePath = path.join(process.cwd(), projectName, '.env.example');
        await fs.writeFile(envExampleFilePath, envExampleContent);
        this.logger.info(`✅ Archivo .env.example creado en: ${envExampleFilePath}`);
      }

      // Lista de posibles ubicaciones de templates
      const possibleTemplatePaths = [
        // En modo desarrollo
        path.join(templatesBasePath, 'project'),
        // En modo producción
        path.join(templatesBasePath, 'project'),
        // Desde node_modules (instalación global)
        path.resolve(process.cwd(), 'node_modules/@angelitosystems/rapidfast/templates/project'),
        path.resolve(process.cwd(), 'node_modules/@angelitosystems/rapidfast/dist/templates/project'),
        // Desde instalación global en npm
        path.resolve(process.env.APPDATA || '', 'npm/node_modules/@angelitosystems/rapidfast/templates/project'),
        path.resolve(process.env.APPDATA || '', 'npm/node_modules/@angelitosystems/rapidfast/dist/templates/project'),
        // Rutas específicas para instalaciones globales en diferentes sistemas
        path.resolve('/usr/local/lib/node_modules/@angelitosystems/rapidfast/templates/project'),
        path.resolve('/usr/local/lib/node_modules/@angelitosystems/rapidfast/dist/templates/project')
      ];
      
      // Buscar la primera ruta de templates que exista
      let templatesPath = '';
      for (const templatePath of possibleTemplatePaths) {
        if (fs.existsSync(templatePath)) {
          templatesPath = templatePath;
          this.logger.info(`Usando templates desde: ${templatesPath}`);
          break;
        }
      }
      
      if (!templatesPath || !fs.existsSync(templatesPath)) {
        throw new Error(`No se encontró el directorio de templates. Rutas buscadas: ${possibleTemplatePaths.join(', ')}`);
      }
      
      this.logger.info(`Copiando templates desde: ${templatesPath}`);
      
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
      
      // Verificar que se hayan copiado los archivos principales
      const expectedFiles = ['package.json.template', 'tsconfig.json.template', 'README.md.template'];
      const missingFiles = [];
      
      for (const file of expectedFiles) {
        const filePath = path.join(projectPath, file);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(file);
        }
      }
      
      if (missingFiles.length > 0) {
        this.logger.warn(`Advertencia: No se encontraron algunos archivos de plantilla: ${missingFiles.join(', ')}`);
        this.logger.info('Intentando copiar archivos faltantes individualmente...');
        
        for (const file of missingFiles) {
          for (const templatePath of possibleTemplatePaths) {
            const sourcePath = path.join(templatePath, file);
            if (fs.existsSync(sourcePath)) {
              await fs.copy(sourcePath, path.join(projectPath, file));
              this.logger.info(`✅ Archivo ${file} copiado manualmente`);
              break;
            }
          }
        }
      }
      
      // Verificar que se haya copiado la carpeta src
      const srcPath = path.join(projectPath, 'src');
      if (!fs.existsSync(srcPath)) {
        this.logger.warn('Advertencia: No se encontró la carpeta src en el proyecto');
        
        // Intentar copiar la carpeta src manualmente
        for (const templatePath of possibleTemplatePaths) {
          const sourceSrcPath = path.join(templatePath, 'src');
          if (fs.existsSync(sourceSrcPath)) {
            await fs.copy(sourceSrcPath, srcPath);
            this.logger.info(`✅ Carpeta src copiada manualmente`);
            break;
          }
        }
      }
      
      // Procesar archivos de plantilla .template
      await this.processTemplateFiles(projectPath, projectName);
      
      // Crear el archivo .env si no existe
      const envPath = path.join(projectPath, '.env');
      if (!fs.existsSync(envPath)) {
        // Buscar la plantilla .env.example en varias ubicaciones
        const envExamplePaths = [
          path.join(templatesPath, '.env.example.template'),
          path.join(templatesPath, '.env.example'),
          path.join(templatesPath, '../env.example'),
          path.resolve(__dirname, '../../../templates/project/.env.example.template'),
          path.resolve(__dirname, '../../../templates/env.example'),
          path.resolve(__dirname, '../../templates/env.example'),
          path.resolve(process.env.APPDATA || '', 'npm/node_modules/@angelitosystems/rapidfast/templates/env.example'),
          path.resolve(process.env.APPDATA || '', 'npm/node_modules/@angelitosystems/rapidfast/dist/templates/env.example')
        ];
        
        let envTemplatePath = '';
        for (const templatePath of envExamplePaths) {
          if (fs.existsSync(templatePath)) {
            envTemplatePath = templatePath;
            break;
          }
        }
        
        if (envTemplatePath) {
          this.logger.info(`Usando plantilla de .env desde: ${envTemplatePath}`);
          // Copiar desde la plantilla
          const content = await fs.readFile(envTemplatePath, 'utf8');
          const processedContent = content
            .replace(/{{name}}/g, projectName)
            .replace(/{{projectName}}/g, projectName)
            .replace(/{{projectDescription}}/g, 'API built with RapidFAST Framework')
            .replace(/{{date}}/g, new Date().toISOString().split('T')[0])
            .replace(/{{JWT_SECRET}}/g, this.generateRandomSecret());
            
          await fs.writeFile(envPath, processedContent);
          this.logger.info(`✅ Archivo .env creado en: ${envPath}`);
          
          // También crear .env.example
          const envExamplePath = path.join(projectPath, '.env.example');
          await fs.writeFile(envExamplePath, processedContent);
          this.logger.info(`✅ Archivo .env.example creado en: ${envExamplePath}`);
        } else {
          this.logger.warn('No se encontró plantilla para .env');
        }
      }
      
      // Verificar la estructura final del proyecto
      this.logger.info('Verificando estructura del proyecto...');
      const projectFiles = await fs.readdir(projectPath);
      this.logger.info(`Archivos en la raíz del proyecto: ${projectFiles.join(', ')}`);
      
      if (fs.existsSync(srcPath)) {
        const srcFiles = await fs.readdir(srcPath);
        this.logger.info(`Archivos en la carpeta src: ${srcFiles.join(', ')}`);
      }
    } catch (error) {
      this.logger.error('Error al copiar templates:', error);
      throw error;
    }
  }

  private async processTemplateFiles(projectPath: string, projectName: string): Promise<void> {
    try {
      this.logger.info(`Procesando archivos de plantilla en: ${projectPath}`);
      
      // Función recursiva para encontrar archivos de plantilla
      const findTemplateFiles = async (dir: string): Promise<string[]> => {
        const files: string[] = [];
        
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
              // Recursivamente buscar en subdirectorios
              const subFiles = await findTemplateFiles(fullPath);
              files.push(...subFiles);
            } else if (entry.name.endsWith('.template')) {
              // Agregar archivo de plantilla a la lista
              files.push(fullPath);
            }
          }
        } catch (error) {
          this.logger.warn(`Error al leer directorio ${dir}: ${error}`);
        }
        
        return files;
      };
      
      // Buscar todos los archivos .template recursivamente
      const templateFiles = await findTemplateFiles(projectPath);
      this.logger.info(`Encontrados ${templateFiles.length} archivos de plantilla para procesar`);
      
      if (templateFiles.length === 0) {
        this.logger.warn('No se encontraron archivos de plantilla para procesar');
        return;
      }
      
      // Procesar cada archivo de plantilla
      for (const templateFile of templateFiles) {
        try {
          const targetFile = templateFile.replace('.template', '');
          
          // Leer el contenido de la plantilla
          const content = await fs.readFile(templateFile, 'utf8');
          
          // Reemplazar placeholders
          let processedContent = content
            .replace(/{{name}}/g, projectName)
            .replace(/{{projectName}}/g, projectName)
            .replace(/{{projectDescription}}/g, 'API built with RapidFAST Framework')
            .replace(/{{date}}/g, new Date().toISOString().split('T')[0])
            .replace(/{{JWT_SECRET}}/g, this.generateRandomSecret());
          
          // Si es el package.json y estamos en modo local, ajustar la dependencia de RapidFAST
          if (path.basename(targetFile) === 'package.json' && this.isLocal) {
            try {
              const packageJson = JSON.parse(processedContent);
              // En modo local, usamos la ruta absoluta al paquete local
              const localPackagePath = path.resolve(__dirname, '../../../');
              this.logger.info(`Usando ruta absoluta para RapidFast: ${localPackagePath}`);
              packageJson.dependencies['@angelitosystems/rapidfast'] = `file:${localPackagePath}`;
              processedContent = JSON.stringify(packageJson, null, 2);
            } catch (error) {
              this.logger.warn('Error al modificar package.json para modo local:', error);
            }
          }
          
          // Escribir el archivo procesado
          await fs.writeFile(targetFile, processedContent);
          
          // Eliminar el archivo de plantilla
          await fs.remove(templateFile);
          
          this.logger.info(`✅ Archivo procesado: ${path.relative(projectPath, targetFile)}`);
        } catch (error) {
          this.logger.error(`Error al procesar archivo ${templateFile}: ${error}`);
        }
      }
      
      // Verificar si hay archivos de plantilla que no se procesaron
      const remainingTemplates = await findTemplateFiles(projectPath);
      if (remainingTemplates.length > 0) {
        this.logger.warn(`Advertencia: Quedaron ${remainingTemplates.length} archivos de plantilla sin procesar`);
        for (const template of remainingTemplates) {
          this.logger.warn(`- ${path.relative(projectPath, template)}`);
        }
      }
    } catch (error) {
      this.logger.error('Error al procesar archivos de plantilla:', error);
      throw error;
    }
  }

  public async execute(name: string, options: NewCommandOptions = {}): Promise<void> {
    try {
      this.isLocal = options.local || false;
      this.logger.info(`Configurando el nuevo proyecto RapidFAST...`);

      // Verificar si el directorio ya existe
      const projectPath = path.resolve(process.cwd(), name);
      if (await fs.pathExists(projectPath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `La carpeta ${projectPath} ya existe. ¿Deseas sobrescribirla?`,
            default: false
          }
        ]);

        if (!overwrite) {
          this.logger.info('Operación cancelada.');
          return;
        }

        await fs.remove(projectPath);
      }

      // Obtener detalles del proyecto
      const answers = await this.promptForProjectDetails(name);
      
      // Obtener configuración de la base de datos
      const dbConfig = await this.promptForDatabaseConfig(answers['database.type']);
      
      // Configurar el spinner
      this.spinner.start('Iniciando creación del proyecto...');
      
      const targetPath = options.directory || path.join(process.cwd(), name);
      
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

        // Si existe y se aprobó sobrescribir, implementamos una limpieza robusta con reintentos
        try {
          this.spinner.start('Limpiando archivos existentes...');
          const maxRetries = 3;
          const retryDelay = 1000; // 1 segundo entre reintentos

          const removeWithRetry = async (filePath: string, retries = 0): Promise<void> => {
            try {
              await fs.remove(filePath);
            } catch (err: unknown) {
              if (err && typeof err === 'object' && 'code' in err && err.code === 'EBUSY' && retries < maxRetries) {
                this.logger.warn(`Archivo ${filePath} ocupado, reintentando en ${retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return removeWithRetry(filePath, retries + 1);
              }
              throw err;
            }
          };

          // Primero cerramos cualquier handle de archivo abierto
          if (process.platform === 'win32') {
            await execAsync('taskkill /F /IM node.exe /T').catch(() => {});
          }

          const files = await fs.readdir(projectPath);
          for (const file of files) {
            const filePath = path.join(projectPath, file);
            await removeWithRetry(filePath).catch(err => {
              this.logger.warn(`No se pudo eliminar ${filePath} después de ${maxRetries} intentos: ${err.message}`);
            });
          }
          this.spinner.succeed('Archivos existentes eliminados exitosamente');
        } catch (error) {
          this.spinner.fail('Error al limpiar los archivos existentes');
          this.logger.warn('Error:', error);
          // Continuamos con la creación del proyecto incluso si hay errores al limpiar
        }
      }
      
      this.spinner.start('Creando proyecto RapidFAST...');
      
      // Crear directorio del proyecto
      await fs.ensureDir(projectPath);
      
      // Copiar y procesar templates
      await this.copyTemplates(projectPath, name);
      
      // Generar package.json antes de instalar dependencias
      await this.generatePackageJson(name, answers);
      
      // Generar archivo .env (con los valores completos del proyecto)
      await this.generateEnvFile({
        ...answers,
        name,
        directory: projectPath
      });
      
      // Instalar dependencias
      if (!options.skipInstall) {
        this.spinner.text = 'Instalando dependencias...';
        await this.installDependencies(projectPath, answers.packageManager);
        
        // Instalar paquetes adicionales después de la instalación principal
        try {
          const packageManager = answers.packageManager;
          const installCommands = {
            npm: 'npm install',
            yarn: 'yarn add',
            pnpm: 'pnpm add'
          };
          
          this.spinner.text = 'Instalando dependencias adicionales...';
          this.logger.info(`Instalando módulos adicionales en: ${projectPath}`);
          
          // Instalar @types/uuid explícitamente
          await execAsync(`cd "${projectPath}" && ${packageManager} ${packageManager === 'npm' ? 'install --save-dev' : 'add --dev'} @types/uuid`);
          
          // Verificar si hay otras dependencias que necesitan tipos y no están instaladas
          const packageJsonPath = path.join(projectPath, 'package.json');
          const packageJson = await fs.readJson(packageJsonPath);
          
          // Lista de dependencias que podrían necesitar @types
          const depsNeedingTypes = ['express', 'node', 'cors', 'jsonwebtoken'];
          const typesToInstall: string[] = [];
          
          if (packageJson.dependencies) {
            for (const dep of depsNeedingTypes) {
              if (packageJson.dependencies[dep] && 
                  (!packageJson.devDependencies || !packageJson.devDependencies[`@types/${dep}`])) {
                typesToInstall.push(`@types/${dep}`);
              }
            }
          }
          
          // Instalar los @types faltantes
          if (typesToInstall.length > 0) {
            const typesCommand = `cd "${projectPath}" && ${packageManager} ${packageManager === 'npm' ? 'install --save-dev' : 'add --dev'} ${typesToInstall.join(' ')}`;
            this.logger.info(`Instalando tipos adicionales: ${typesToInstall.join(', ')}`);
            await execAsync(typesCommand);
          }
          
          this.spinner.succeed('Dependencias adicionales instaladas correctamente');
        } catch (error) {
          this.spinner.warn('Error al instalar dependencias adicionales');
          this.logger.warn('Error:', error);
          // Continuamos incluso si este paso falla
        }
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
