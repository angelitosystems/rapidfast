#!/usr/bin/env node

/**
 * Script para corregir automáticamente los errores de linting
 * Este script ejecuta ESLint con la opción --fix para corregir
 * automáticamente los errores que pueden ser arreglados.
 */

const { execSync } = require('child_process');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== Corrección automática de errores de linting ====${colors.reset}\n`);

try {
  // Ejecutar ESLint con la opción --fix
  console.log(`${colors.yellow}Ejecutando ESLint con la opción --fix...${colors.reset}`);
  execSync('npm run lint:fix', { stdio: 'inherit' });
  
  console.log(`\n${colors.bright}${colors.green}✓ Corrección de linting completada${colors.reset}`);
  console.log(`${colors.yellow}Nota: Es posible que algunos errores requieran corrección manual.${colors.reset}`);
} catch (error) {
  console.error(`\n${colors.bright}${colors.red}✗ Error durante la corrección de linting:${colors.reset}`);
  console.error(`${colors.red}${error.message}${colors.reset}`);
  
  console.log(`\n${colors.yellow}Algunos errores pueden requerir corrección manual. Revise los mensajes de error.${colors.reset}`);
  process.exit(1);
} 