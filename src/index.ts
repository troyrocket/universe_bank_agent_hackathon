#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { registerWalletCommands } from './commands/wallet.js';
import { registerIdentityCommands } from './commands/identity.js';
import { registerPayCommands } from './commands/pay.js';
import { registerDepositCommands } from './commands/deposit.js';
import { registerCreditCommands } from './commands/credit.js';
import { registerLoanCommands } from './commands/loan.js';
import { registerSimulateCommands } from './commands/simulate.js';

// ANSI Shadow font - UNIVERSE BANK on one line
const LINES = [
  '██╗   ██╗███╗   ██╗██╗██╗   ██╗███████╗██████╗ ███████╗███████╗  ██████╗  █████╗ ███╗   ██╗██╗  ██╗',
  '██║   ██║████╗  ██║██║██║   ██║██╔════╝██╔══██╗██╔════╝██╔════╝  ██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝',
  '██║   ██║██╔██╗ ██║██║██║   ██║█████╗  ██████╔╝███████╗█████╗    ██████╔╝███████║██╔██╗ ██║█████╔╝ ',
  '██║   ██║██║╚██╗██║██║╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██╔══╝    ██╔══██╗██╔══██║██║╚██╗██║██╔═██╗ ',
  '╚██████╔╝██║ ╚████║██║ ╚████╔╝ ███████╗██║  ██║███████║███████╗  ██████╔╝██║  ██║██║ ╚████║██║  ██╗',
  ' ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝',
];

const GRADIENT = [
  '#00d4ff', // cyan
  '#00aaff', // sky blue
  '#3388ff', // blue
  '#5566ff', // indigo
  '#7744ff', // purple
  '#9933ff', // violet
  '#bb33ee', // magenta
  '#dd44cc', // pink
];

function applyGradient(line: string): string {
  const segLen = Math.ceil(line.length / GRADIENT.length);
  let out = '';
  for (let i = 0; i < GRADIENT.length; i++) {
    const start = i * segLen;
    const end = Math.min(start + segLen, line.length);
    if (start >= line.length) break;
    out += chalk.hex(GRADIENT[i])(line.slice(start, end));
  }
  return out;
}

function showBanner() {
  const args = process.argv.slice(2);
  const isHelp = args.length === 0 || args.includes('--help') || args.includes('-h');
  if (isHelp) {
    console.log();
    for (const line of LINES) {
      console.log(applyGradient(line));
    }
    console.log();
    console.log(
      '  ' + chalk.gray('On-chain bank for AI Agents') +
      '    ' + chalk.dim('v0.1.0'),
    );
    console.log(
      '  ' + chalk.gray('Powered by') + ' ' +
      chalk.hex('#0052FF')('Base') + ' ' + chalk.gray('|') + ' ' +
      chalk.hex('#00d4ff')('ERC-8004') + ' ' + chalk.gray('|') + ' ' +
      chalk.hex('#FFD700')('x402') + ' ' + chalk.gray('|') + ' ' +
      chalk.hex('#B6509E')('Aave V3'),
    );
    console.log();
  }
}

showBanner();

const program = new Command();

program
  .name('universe-bank')
  .description('Universe Bank - On-chain bank for AI Agents')
  .version('0.1.0');

registerWalletCommands(program);
registerIdentityCommands(program);
registerPayCommands(program);
registerDepositCommands(program);
registerCreditCommands(program);
registerLoanCommands(program);
registerSimulateCommands(program);

program.parse();
