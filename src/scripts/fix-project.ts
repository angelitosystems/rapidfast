import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

const logger = new Logger();

/**
 * Corrige los problemas de compatibilidad en proyectos existentes
 * @param projectPath Ruta al proyecto a corregir
 */
export async function fixProject(projectPath: string): Promise<void> {
  logger.info('🔧 Corrigiendo proyecto en:', projectPath);
  
  try {
    // Corregir el archivo main.ts
    const mainTsPath = path.join(projectPath, 'src', 'main.ts');
    if (fs.existsSync(mainTsPath)) {
      let mainTsContent = fs.readFileSync(mainTsPath, 'utf8');
      
      // Reemplazar app.register con app.initialize
      if (mainTsContent.includes('app.register(')) {
        mainTsContent = mainTsContent.replace(
          /await\s+app\.register\s*\(\s*(\w+)\s*\)/g,
          'await app.initialize([$1])'
        );
        
        fs.writeFileSync(mainTsPath, mainTsContent);
        logger.info('✅ Archivo main.ts corregido');
      } else {
        logger.info('ℹ️ El archivo main.ts no necesita correcciones');
      }
    } else {
      logger.warn('⚠️ No se encontró el archivo main.ts');
    }
    
    logger.info('✅ Proyecto corregido correctamente');
  } catch (error) {
    logger.error('❌ Error al corregir el proyecto:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const projectPath = process.argv[2];
  if (!projectPath) {
    logger.error('❌ Debe especificar la ruta al proyecto');
    process.exit(1);
  }
  
  fixProject(projectPath)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} 