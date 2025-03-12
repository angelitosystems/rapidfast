#!/usr/bin/env node

/**
 * Este script ejecuta un comando y siempre devuelve un código de salida exitoso,
 * independientemente de si el comando falla o no.
 */

const { execSync } = require('child_process');

// Obtener el comando de los argumentos
const command = process.argv.slice(2).join(' ');

if (!command) {
  console.error('Error: No se proporcionó ningún comando');
  process.exit(0); // Salir con éxito de todos modos
}

try {
  // Ejecutar el comando
  execSync(command, { stdio: 'inherit' });
  process.exit(0);
} catch (error) {
  console.log(`El comando falló, pero continuamos de todos modos: ${error.message}`);
  process.exit(0); // Salir con éxito incluso si el comando falla
} 