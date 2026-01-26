#!/usr/bin/env node
/**
 * Reverso MCP Server CLI entry point.
 *
 * Usage:
 *   reverso-mcp --database .reverso/dev.db
 *   reverso-mcp -d /path/to/database.db
 */

import { resolve } from 'node:path';
import { startMcpServer } from './server.js';
import { VERSION } from './index.js';

function parseArgs(args: string[]): { database: string; help: boolean; version: boolean } {
  const result = {
    database: '.reverso/dev.db',
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--version' || arg === '-v') {
      result.version = true;
    } else if (arg === '--database' || arg === '-d') {
      result.database = args[++i] ?? result.database;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Reverso MCP Server - AI integration for Reverso CMS

Usage:
  reverso-mcp [options]

Options:
  -d, --database <path>  Database file path (default: .reverso/dev.db)
  -h, --help             Show this help message
  -v, --version          Show version number

Examples:
  reverso-mcp
  reverso-mcp --database ./data/cms.db
  reverso-mcp -d /path/to/project/.reverso/dev.db

MCP Configuration:
  Add to your Claude Desktop config (claude_desktop_config.json):

  {
    "mcpServers": {
      "reverso": {
        "command": "npx",
        "args": ["reverso-mcp", "-d", "/path/to/your/.reverso/dev.db"]
      }
    }
  }
`);
}

function printVersion(): void {
  console.log(`reverso-mcp v${VERSION}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.version) {
    printVersion();
    process.exit(0);
  }

  const databasePath = resolve(args.database);

  // Start the MCP server
  await startMcpServer({
    databasePath,
    name: 'reverso-mcp',
    version: VERSION,
  });
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
