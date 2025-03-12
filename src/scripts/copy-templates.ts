import * as fs from 'fs-extra';
import * as path from 'path';

async function copyTemplates() {
  try {
    const sourceDir = path.resolve(__dirname, '../../templates');
    const targetDir = path.resolve(__dirname, '../../dist/templates');

    // Asegurarse de que el directorio de destino exista
    await fs.ensureDir(targetDir);

    // Copiar los templates
    await fs.copy(sourceDir, targetDir, {
      filter: (src) => {
        // Excluir archivos de test
        return !src.includes('.test.') && !src.includes('.spec.');
      },
    });

    console.log('✅ Templates copiados exitosamente');
  } catch (error) {
    console.error('❌ Error al copiar los templates:', error);
    process.exit(1);
  }
}

copyTemplates(); 