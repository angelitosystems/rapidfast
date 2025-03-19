#!/usr/bin/env node

/**
 * Script para publicar una versión beta del paquete
 * Este script maneja todo el proceso de publicación beta, incluyendo:
 * 1. Incrementar la versión beta
 * 2. Construir el proyecto
 * 3. Publicar en npm con la etiqueta beta
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

// Opciones de línea de comandos
const forceMode = process.argv.includes('--force');

console.log(`${colors.bright}${colors.cyan}=== Publicación de versión BETA ====${colors.reset}\n`);

try {
  // Paso 1: Incrementar la versión beta
  console.log(`${colors.yellow}Incrementando versión beta...${colors.reset}`);
  execSync('npm run bump:beta', { stdio: 'inherit' });
  
  // Paso 2: Construir el proyecto
  console.log(`\n${colors.yellow}Construyendo el proyecto...${colors.reset}`);
  execSync('npm run build', { stdio: 'inherit' });
  
  // Paso 3: Publicar en npm
  console.log(`\n${colors.yellow}Publicando en npm con etiqueta beta...${colors.reset}`);
  
  if (forceMode) {
    console.log(`${colors.bright}${colors.red}MODO FORZADO: Ignorando scripts de prepublicación${colors.reset}`);
    execSync('npm run publish:beta:force', { stdio: 'inherit' });
  } else {
    execSync('npm run publish:beta', { stdio: 'inherit' });
  }
  
  console.log(`\n${colors.bright}${colors.green}✓ Publicación beta completada con éxito${colors.reset}`);
} catch (error) {
  console.error(`\n${colors.bright}${colors.red}✗ Error durante la publicación beta:${colors.reset}`);
  console.error(`${colors.red}${error.message}${colors.reset}`);
  process.exit(1);
} 