import { Command } from 'commander';
import * as path from 'path';
import { Logger } from '../../utils/logger';
import { fixProject } from '../../scripts/fix-project';

const logger = new Logger();

export class FixCommand {
  public static register(program: Command): void {
    program
      .command('fix')
      .description('Corrige problemas de compatibilidad en proyectos existentes')
      .option('-p, --path <path>', 'Ruta al proyecto a corregir', process.cwd())
      .action(async (options) => {
        try {
          const projectPath = path.resolve(options.path);
          logger.info('🔧 Iniciando corrección del proyecto en:', projectPath);
          
          await fixProject(projectPath);
          
          logger.info('🎉 Proyecto corregido correctamente');
        } catch (error) {
          logger.error('❌ Error al corregir el proyecto:', error);
          process.exit(1);
        }
      });
  }
} 