#!/usr/bin/env node

import { Command } from 'commander';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { NewCommand } from '../commands/new.command';
import { ServeCommand } from '../commands/serve.command';
import { GenerateCommand } from '../commands/generate.command';
import { FixCommand } from '../commands/fix.command';
import { VERSION } from '../../index';

const program = new Command();

// Mostrar banner
console.log(
  gradient.pastel.multiline(
    figlet.textSync('RapidFAST', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    })
  )
);

program
  .version(VERSION)
  .description('RapidFAST Framework CLI - Desarrollo rápido de APIs RESTful');

// Comando new
program
  .command('new <n>')
  .description('Crear un nuevo proyecto RapidFAST')
  .option('-d, --directory <dir>', 'Directorio donde crear el proyecto')
  .option('-s, --skip-install', 'Omitir instalación de dependencias')
  .option(
    '-p, --package-manager <manager>',
    'Gestor de paquetes a utilizar (npm, yarn, pnpm)',
    'npm'
  )
  .action(async (name: string, options) => {
    const command = new NewCommand();
    await command.execute(name, options);
  });

// Comando serve
program
  .command('serve')
  .description('Iniciar el servidor de desarrollo con RapidWatch™')
  .option('-p, --port <number>', 'Puerto del servidor', '3000')
  .option('-h, --host <host>', 'Host del servidor', 'localhost')
  .option('-w, --watch', 'Activar RapidWatch™', true)
  .option('--no-watch', 'Desactivar RapidWatch™')
  .option('-d, --dev', 'Modo desarrollo', true)
  .option('--prod', 'Modo producción')
  .action(async (options) => {
    const command = new ServeCommand();
    await command.execute(options);
  });

// Comando generate
program
  .command('generate <type> <n>')
  .alias('g')
  .description('Generar un nuevo recurso')
  .option('-d, --directory <dir>', 'Directorio donde crear el recurso')
  .action(async (type: string, name: string, options) => {
    const command = new GenerateCommand();
    await command.execute(type, name, options);
  });

// Comando fix
FixCommand.register(program);

program.parse(process.argv); 