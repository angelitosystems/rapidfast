import { Logger } from '../../utils/logger';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';

interface GenerateOptions {
  directory?: string;
}

type ResourceType = 'controller' | 'service' | 'module' | 'entity' | 'middleware';

export class GenerateCommand {
  private readonly logger: Logger;
  private spinner: ReturnType<typeof ora>;
  private readonly templates = {
    controller: 'controller.template.ts',
    service: 'service.template.ts',
    module: 'module.template.ts',
    entity: 'entity.template.ts',
    middleware: 'middleware.template.ts',
  };

  constructor() {
    this.logger = new Logger();
    this.spinner = ora();
  }

  public async execute(type: string, name: string, options: GenerateOptions): Promise<void> {
    try {
      if (!this.isValidResourceType(type)) {
        throw new Error(`Tipo de recurso inválido: ${type}`);
      }

      const resourceType = type as ResourceType;
      const targetPath = this.getTargetPath(name, resourceType, options.directory);

      this.spinner.start(`Generando ${resourceType}: ${name}`);

      await this.generateResource(name, resourceType, targetPath);

      this.spinner.succeed(`${resourceType} generado exitosamente`);
      this.displayResourceInfo(name, resourceType, targetPath);
    } catch (error) {
      this.spinner.fail('Error al generar el recurso');
      this.logger.error('Error:', error);
      process.exit(1);
    }
  }

  private isValidResourceType(type: string): type is ResourceType {
    return Object.keys(this.templates).includes(type);
  }

  private getTargetPath(name: string, type: ResourceType, directory?: string): string {
    const baseDir = directory || process.cwd();
    const typeDir = `src/${type}s`;
    return path.join(baseDir, typeDir, this.formatFileName(name, type));
  }

  private formatFileName(name: string, type: ResourceType): string {
    const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${baseName}.${type}.ts`;
  }

  private async generateResource(name: string, type: ResourceType, targetPath: string): Promise<void> {
    const templatePath = path.join(__dirname, '../../../templates', this.templates[type]);
    const templateContent = await fs.readFile(templatePath, 'utf8');
    
    const content = this.processTemplate(templateContent, {
      name,
      className: this.formatClassName(name, type),
    });

    await fs.ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, content);
  }

  private processTemplate(template: string, data: { name: string; className: string }): string {
    return template
      .replace(/\$\{name\}/g, data.name)
      .replace(/\$\{className\}/g, data.className);
  }

  private formatClassName(name: string, type: ResourceType): string {
    return name
      .split(/[-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('') + type.charAt(0).toUpperCase() + type.slice(1);
  }

  private displayResourceInfo(name: string, type: ResourceType, targetPath: string): void {
    const messages = [
      `\n${chalk.green(`¡${type} generado exitosamente!`)}`,
      '\nArchivo creado en:',
      chalk.cyan(targetPath),
      `\nPara usar este ${type}:`,
      `1. Importa el ${type} en tu módulo`,
      `2. Agrega el ${type} a la sección correspondiente del decorador @Module`,
      '\nEjemplo:',
      chalk.gray(`
import { ${this.formatClassName(name, type)} } from '${targetPath}';

@Module({
  ${type}s: [${this.formatClassName(name, type)}]
})
export class AppModule {}`),
      '\n',
    ].join('\n');

    console.log(messages);
  }
} 