#!/usr/bin/env node

/**
 * Script para actualizar la versión de TypeScript en el proyecto
 * Este script actualiza la versión de TypeScript en package.json
 * para que sea compatible con @typescript-eslint
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== Actualización de TypeScript ====${colors.reset}\n`);

// Leer package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error(`${colors.red}Error al leer package.json: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Versión actual de TypeScript
const currentVersion = packageJson.dependencies.typescript || packageJson.devDependencies.typescript;
console.log(`${colors.yellow}Versión actual de TypeScript: ${colors.bright}${currentVersion}${colors.reset}`);

// Versión compatible con @typescript-eslint
const compatibleVersion = '5.1.6';
console.log(`${colors.yellow}Versión compatible con @typescript-eslint: ${colors.bright}${compatibleVersion}${colors.reset}`);

// Actualizar la versión
if (packageJson.dependencies && packageJson.dependencies.typescript) {
  packageJson.dependencies.typescript = compatibleVersion;
} else if (packageJson.devDependencies && packageJson.devDependencies.typescript) {
  packageJson.devDependencies.typescript = compatibleVersion;
} else {
  console.error(`${colors.red}No se encontró TypeScript en las dependencias${colors.reset}`);
  process.exit(1);
}

// Guardar package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`\n${colors.green}Versión de TypeScript actualizada a ${colors.bright}${compatibleVersion}${colors.reset}`);

// Preguntar si desea instalar las dependencias
console.log(`\n${colors.yellow}¿Desea instalar las dependencias actualizadas? (s/n)${colors.reset}`);
process.stdin.once('data', (data) => {
  const answer = data.toString().trim().toLowerCase();
  
  if (answer === 's' || answer === 'si' || answer === 'y' || answer === 'yes') {
    console.log(`\n${colors.yellow}Instalando dependencias...${colors.reset}`);
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log(`\n${colors.green}Dependencias instaladas correctamente${colors.reset}`);
    } catch (error) {
      console.error(`\n${colors.red}Error al instalar dependencias: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  } else {
    console.log(`\n${colors.yellow}No se instalaron las dependencias. Ejecute ${colors.bright}npm install${colors.reset}${colors.yellow} para instalarlas manualmente.${colors.reset}`);
  }
  
  process.exit(0);
}); 