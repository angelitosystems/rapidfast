import * as fs from 'fs-extra';
import * as path from 'path';

async function copyTemplates() {
  try {
    const sourceDir = path.resolve(__dirname, '../../templates');
    const targetDir = path.resolve(__dirname, '../../dist/templates');

    // Asegurarse de que el directorio de destino exista
    await fs.ensureDir(targetDir);

    console.log(`Copiando templates desde: ${sourceDir}`);
    console.log(`Destino: ${targetDir}`);

    // Verificar que el directorio fuente exista
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`El directorio de templates no existe: ${sourceDir}`);
    }

    // Listar archivos en el directorio fuente antes de copiar
    const sourceFiles = await fs.readdir(sourceDir, { withFileTypes: true });
    console.log('Archivos en el directorio fuente:');
    for (const file of sourceFiles) {
      console.log(`- ${file.name} ${file.isDirectory() ? '(directorio)' : '(archivo)'}`);
    }

    // Copiar los templates
    await fs.copy(sourceDir, targetDir, {
      filter: (src) => {
        // Excluir archivos de test pero preservar todos los .template
        return !src.includes('.test.') && !src.includes('.spec.');
      },
      overwrite: true,
      errorOnExist: false,
      preserveTimestamps: true
    });

    // Verificar que se hayan copiado los archivos
    const targetFiles = await fs.readdir(targetDir, { withFileTypes: true });
    console.log('Archivos copiados al directorio destino:');
    for (const file of targetFiles) {
      console.log(`- ${file.name} ${file.isDirectory() ? '(directorio)' : '(archivo)'}`);
    }

    // Verificar específicamente la carpeta project
    const projectDir = path.join(targetDir, 'project');
    if (fs.existsSync(projectDir)) {
      const projectFiles = await fs.readdir(projectDir, { withFileTypes: true });
      console.log('Archivos en la carpeta project:');
      for (const file of projectFiles) {
        console.log(`- ${file.name} ${file.isDirectory() ? '(directorio)' : '(archivo)'}`);
      }

      // Verificar la carpeta src dentro de project
      const srcDir = path.join(projectDir, 'src');
      if (fs.existsSync(srcDir)) {
        const srcFiles = await fs.readdir(srcDir, { withFileTypes: true });
        console.log('Archivos en la carpeta src:');
        for (const file of srcFiles) {
          console.log(`- ${file.name} ${file.isDirectory() ? '(directorio)' : '(archivo)'}`);
        }
      } else {
        console.warn('⚠️ La carpeta src no existe en el directorio project');
      }
    } else {
      console.warn('⚠️ La carpeta project no existe en el directorio destino');
    }

    console.log('✅ Templates copiados exitosamente');
  } catch (error) {
    console.error('❌ Error al copiar los templates:', error);
    process.exit(1);
  }
}

copyTemplates(); 