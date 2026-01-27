#!/usr/bin/env node
/**
 * Reverso CLI entry point.
 */

import { program } from 'commander';
import { buildCommand } from './commands/build.js';
import { devCommand } from './commands/dev.js';
import { initCommand } from './commands/init.js';
import { migrateCommand } from './commands/migrate.js';
import { scanCommand } from './commands/scan.js';
import { startCommand } from './commands/start.js';
import { VERSION } from './index.js';

program
  .name('reverso')
  .description('Command line interface for Reverso CMS')
  .version(VERSION);

// Register commands
initCommand(program);
scanCommand(program);
devCommand(program);
buildCommand(program);
startCommand(program);
migrateCommand(program);

program.parse();
