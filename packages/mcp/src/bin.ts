#!/usr/bin/env node
/**
 * Reverso MCP Server CLI entry point.
 *
 * The server talks to a running Reverso API; it never opens the database.
 *
 * Usage:
 *   REVERSO_API_KEY=... reverso-mcp
 *   reverso-mcp --api-url http://localhost:3001 --api-key <key>
 */

import { DEFAULT_API_URL, resolveMcpConfig } from './config.js';
import { VERSION } from './index.js';
import { startMcpServer } from './server.js';

interface CliArgs {
  apiUrl?: string;
  apiKey?: string;
  help: boolean;
  version: boolean;
  /** Flags from the old database-backed CLI, reported with a clear message. */
  removed: string[];
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = { help: false, version: false, removed: [] };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--version' || arg === '-v') {
      result.version = true;
    } else if (arg === '--api-url' || arg === '-u') {
      result.apiUrl = args[++i];
    } else if (arg === '--api-key' || arg === '-k') {
      result.apiKey = args[++i];
    } else if (arg === '--database' || arg === '-d') {
      result.removed.push(arg);
      i++;
    } else if (arg?.startsWith('--api-url=')) {
      result.apiUrl = arg.slice('--api-url='.length);
    } else if (arg?.startsWith('--api-key=')) {
      result.apiKey = arg.slice('--api-key='.length);
    } else if (arg?.startsWith('--database=')) {
      result.removed.push('--database');
    }
  }

  return result;
}

function printHelp(): void {
  // biome-ignore lint/suspicious/noConsole: CLI output belongs on the terminal
  console.info(`
Reverso MCP Server - AI integration for Reverso CMS

The server is a client of the Reverso HTTP API: start your CMS first
(\`reverso dev\` or \`reverso start\`), then point the MCP server at it.

Usage:
  reverso-mcp [options]

Options:
  -u, --api-url <url>  Reverso API URL (default: $REVERSO_API_URL or ${DEFAULT_API_URL})
  -k, --api-key <key>  Admin API key (default: $REVERSO_API_KEY; required, 16+ characters)
  -h, --help           Show this help message
  -v, --version        Show version number

Environment:
  REVERSO_API_URL      Same as --api-url
  REVERSO_API_KEY      Same as --api-key

Examples:
  REVERSO_API_KEY=<key> reverso-mcp
  reverso-mcp --api-url https://cms.example.com --api-key <key>

MCP Configuration:
  Add to your Claude Desktop config (claude_desktop_config.json):

  {
    "mcpServers": {
      "reverso": {
        "command": "npx",
        "args": ["-y", "@reverso/mcp"],
        "env": {
          "REVERSO_API_URL": "http://localhost:3001",
          "REVERSO_API_KEY": "<your admin API key>"
        }
      }
    }
  }
`);
}

function printVersion(): void {
  // biome-ignore lint/suspicious/noConsole: CLI output belongs on the terminal
  console.info(`reverso-mcp v${VERSION}`);
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

  if (args.removed.length > 0) {
    // biome-ignore lint/suspicious/noConsole: CLI output belongs on the terminal
    console.error(
      `reverso-mcp no longer opens the database directly (${args.removed.join(', ')} was removed). ` +
        'Start the Reverso API and set REVERSO_API_URL / REVERSO_API_KEY (or --api-url / --api-key) instead.'
    );
    process.exit(1);
  }

  let config: ReturnType<typeof resolveMcpConfig>;
  try {
    config = resolveMcpConfig(process.env, { apiUrl: args.apiUrl, apiKey: args.apiKey });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: CLI output belongs on the terminal
    console.error(`reverso-mcp: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  await startMcpServer({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    name: 'reverso-mcp',
    version: VERSION,
  });
}

main().catch((error) => {
  // biome-ignore lint/suspicious/noConsole: CLI output belongs on the terminal
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
