#!/usr/bin/env node
/**
 * create-reverso CLI entry point.
 * Run with: npx create-reverso
 */

import { createReverso } from './index.js';

createReverso().catch((error) => {
  console.error(error);
  process.exit(1);
});
