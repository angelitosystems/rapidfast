#!/usr/bin/env node

/**
 * Script para incrementar la versión del paquete
 * Soporta incrementos de tipo:
 * - patch (por defecto): 1.0.0 -> 1.0.1
 * - minor: 1.0.0 -> 1.1.0
 * - major: 1.0.0 -> 2.0.0
 * 
 * Con la opción --beta, añade o incrementa el sufijo beta:
 * - 1.0.0 -> 1.0.0-beta.0
 * - 1.0.0-beta.0 -> 1.0.0-beta.1
 */

const fs = require('fs');
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

// Obtener argumentos
const args = process.argv.slice(2);
const versionType = args[0] || 'patch';
const isBeta = args.includes('--beta');

// Validar tipo de versión
if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error(`${colors.red}Tipo de versión inválido: ${versionType}${colors.reset}`);
  console.error(`${colors.yellow}Tipos válidos: patch, minor, major${colors.reset}`);
  process.exit(1);
}

// Leer package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
  console.error(`${colors.red}Error al leer package.json: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Obtener versión actual
const currentVersion = packageJson.version;
console.log(`${colors.yellow}Versión actual: ${colors.bright}${currentVersion}${colors.reset}`);

// Función para incrementar versión
function incrementVersion(version, type, beta) {
  // Separar versión y prerelease
  const [versionPart, prereleasePart] = version.split('-');
  const [major, minor, patch] = versionPart.split('.').map(Number);
  
  let newMajor = major;
  let newMinor = minor;
  let newPatch = patch;
  
  // Incrementar según el tipo
  if (type === 'major') {
    newMajor++;
    newMinor = 0;
    newPatch = 0;
  } else if (type === 'minor') {
    newMinor++;
    newPatch = 0;
  } else if (type === 'patch') {
    newPatch++;
  }
  
  // Formar nueva versión base
  let newVersion = `${newMajor}.${newMinor}.${newPatch}`;
  
  // Manejar beta si es necesario
  if (beta) {
    // Si ya es beta, incrementar el número
    if (prereleasePart && prereleasePart.startsWith('beta.')) {
      const betaNumber = parseInt(prereleasePart.split('.')[1], 10);
      newVersion = `${versionPart}-beta.${betaNumber + 1}`;
    } else {
      // Si no es beta, añadir beta.0
      newVersion = `${newVersion}-beta.0`;
    }
  }
  
  return newVersion;
}

// Incrementar versión
const newVersion = incrementVersion(currentVersion, versionType, isBeta);

// Actualizar package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`${colors.green}Versión actualizada: ${colors.bright}${newVersion}${colors.reset}`);

// Mostrar comando para publicar
if (isBeta) {
  console.log(`\n${colors.cyan}Para publicar esta versión beta:${colors.reset}`);
  console.log(`${colors.yellow}npm run publish:beta${colors.reset}`);
} else {
  console.log(`\n${colors.cyan}Para publicar esta versión:${colors.reset}`);
  console.log(`${colors.yellow}npm publish${colors.reset}`);
} 