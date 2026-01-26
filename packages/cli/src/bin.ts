#!/usr/bin/env node
/**
 * Reverso CLI entry point.
 */

import { program } from 'commander';
import { devCommand } from './commands/dev.js';
import { migrateCommand } from './commands/migrate.js';
import { scanCommand } from './commands/scan.js';
import { VERSION } from './index.js';

program
  .name('reverso')
  .description('Command line interface for Reverso CMS')
  .version(VERSION);

// Register commands
scanCommand(program);
devCommand(program);
migrateCommand(program);

program.parse();
