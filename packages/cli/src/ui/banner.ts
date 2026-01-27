/**
 * CLI branding and welcome banner.
 */

import chalk from 'chalk';
import gradient from 'gradient-string';
import boxen from 'boxen';

// Custom gradient colors (blue to purple)
const reversoGradient = gradient(['#3b82f6', '#8b5cf6', '#d946ef']);

// Official Reverso ASCII art logo
const REVERSO_LOGO = `
             ███████████████▓▒
               ▒███░         ▓███░
               ▒███           ▒███░
               ▒███            ████
               ▒███            ███▓      ░██▓▓██▓    ████████▒   ▓█████▓   ▒██▓▓██▓       ░▓█░ ▒████░   ▓██▓████        ▓██▓███▓
               ▒███           ▓███     ░██░    ░██▓    ░███▒       ▓█░   ▒██░    ▒██▓   ▒████▓█▒▒███▒ ▒██     ▒█▒     ███      ███░
               ▒██▒         ▒███      ▒██▓      ▓██▒    ▒███░     ░█▒   ▒██▒      ███░    ████        ███      █▒   ▒███        ███░
               ░░   ▒▓▓▓████░         ███▒      ████     ████     █▓   ░███░     ░███▓    ███▒        ▓███▓         ████        ▓███
               ▒███░       ████      ░████▒▒▒▒▒▒▒▒▒░      ███▓   ▓█    ▒███▓▒▒▒▒▒▒▒▒▒     ███▒         ░██████░     ███▒        ▒███░
               ▒███░        ████░    ░███░                ░███▒ ░█░    ▒███░              ███▒            ▒█████▒   ███▒        ▒███░
               ▒███░         ▓███▒    ███▓         ▒       ▒███░█▒      ███▒         ▒    ███▒               ▒███▒  ▓███        ▓███
               ▒███░          ▓███▒   ░███▒       █▓        ▓███▓       ░███▒       █▒    ███▒        █▒      ▓██▒  ░███░      ░███
               ████▒           ▒████░   █████▒▒▒██░          ███          █████▒▒▓██     ░███▓        ██▒     ██▒     ▓██▒    ▒██▒
             ░░░░░░░░░           ░░░░░     ▒▓▓▓▒              ▒             ░▒▓▓▓▒      ░░░░░░░░       ░▒▒▓▓▓▒           ▒▒▓▓▒░
`;

// Compact version for smaller terminals
const REVERSO_LOGO_COMPACT = `
    ██████╗ ███████╗██╗   ██╗███████╗██████╗ ███████╗ ██████╗
    ██╔══██╗██╔════╝██║   ██║██╔════╝██╔══██╗██╔════╝██╔═══██╗
    ██████╔╝█████╗  ██║   ██║█████╗  ██████╔╝███████╗██║   ██║
    ██╔══██╗██╔══╝  ╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██║   ██║
    ██║  ██║███████╗ ╚████╔╝ ███████╗██║  ██║███████║╚██████╔╝
    ╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝
`;

// Minimal version
const REVERSO_LOGO_MINIMAL = `
   ╦═╗ ╔═╗ ╦  ╦ ╔═╗ ╦═╗ ╔═╗ ╔═╗
   ╠╦╝ ║╣  ╚╗╔╝ ║╣  ╠╦╝ ╚═╗ ║ ║
   ╩╚═ ╚═╝  ╚╝  ╚═╝ ╩╚═ ╚═╝ ╚═╝
`;

export type LogoStyle = 'default' | 'compact' | 'minimal';

/**
 * Generate ASCII art logo
 */
export function generateLogo(style: LogoStyle = 'default'): string {
  const logos: Record<LogoStyle, string> = {
    default: REVERSO_LOGO,
    compact: REVERSO_LOGO_COMPACT,
    minimal: REVERSO_LOGO_MINIMAL,
  };

  return reversoGradient(logos[style]);
}

/**
 * Display the welcome banner
 */
export function showBanner(options?: { version?: string; compact?: boolean }): void {
  const { version = '0.1.0', compact = false } = options ?? {};

  if (compact) {
    // Compact banner for subcommands
    console.log();
    console.log(reversoGradient('  ▶ Reverso CMS') + chalk.gray(` v${version}`));
    console.log();
    return;
  }

  // Full banner
  console.log();
  console.log(generateLogo('compact'));
  console.log();

  const tagline = chalk.bold('The front-to-back CMS for modern web development');
  const description = chalk.gray('Add markers to your React code. Get a fully-featured CMS automatically.');

  console.log(tagline);
  console.log(description);
  console.log();

  // Info box
  const infoContent = [
    `${chalk.cyan('Version')}    ${version}`,
    `${chalk.cyan('Docs')}       ${chalk.underline('https://reverso.dev/docs')}`,
    `${chalk.cyan('GitHub')}     ${chalk.underline('https://github.com/hogrid/reverso')}`,
  ].join('\n');

  console.log(
    boxen(infoContent, {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'gray',
    })
  );
}

/**
 * Show a success message in a box
 */
export function showSuccess(title: string, messages: string[]): void {
  const content = messages.join('\n');
  console.log(
    boxen(content, {
      title: chalk.green.bold(`✓ ${title}`),
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'green',
    })
  );
}

/**
 * Show an error message in a box
 */
export function showError(title: string, messages: string[]): void {
  const content = messages.join('\n');
  console.log(
    boxen(content, {
      title: chalk.red.bold(`✖ ${title}`),
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'red',
    })
  );
}

/**
 * Show a tip/hint box
 */
export function showTip(content: string): void {
  console.log(
    boxen(content, {
      title: chalk.yellow.bold('💡 Tip'),
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'yellow',
    })
  );
}

/**
 * Show next steps in a formatted way
 */
export function showNextSteps(steps: Array<{ step: string; command?: string }>): void {
  console.log(chalk.bold('\n📋 Next Steps:\n'));

  steps.forEach((item, index) => {
    const number = chalk.cyan.bold(`${index + 1}.`);
    console.log(`   ${number} ${item.step}`);
    if (item.command) {
      console.log(chalk.gray(`      $ ${chalk.cyan(item.command)}`));
    }
    console.log();
  });
}

/**
 * Show a divider line
 */
export function showDivider(): void {
  console.log(chalk.gray('─'.repeat(50)));
}
