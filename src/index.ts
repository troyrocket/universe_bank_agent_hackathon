#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { registerWalletCommands } from './commands/wallet.js';
import { registerIdentityCommands } from './commands/identity.js';
import { registerPayCommands } from './commands/pay.js';
import { registerDepositCommands } from './commands/deposit.js';

const LOGO =
  '\n' +
  chalk.bold.cyan('  _   _ _   _ _____     _______ ____  ____  _____') + '\n' +
  chalk.bold.cyan(' | | | | \\ | |_ _\\ \\   / / ____|  _ \\/ ___|| ____|') + '\n' +
  chalk.bold.cyan(' | | | |  \\| || | \\ \\ / /|  _| | |_) \\___ \\|  _|') + '\n' +
  chalk.bold.cyan(' | |_| | |\\  || |  \\ V / | |___|  _ < ___) | |___') + '\n' +
  chalk.bold.cyan('  \\___/|_| \\_|___|  \\_/  |_____|_| \\_\\____/|_____|') + '\n' +
  '\n' +
  chalk.bold.white('  ____    _    _   _ _  __') + '\n' +
  chalk.bold.white(' | __ )  / \\  | \\ | | |/ /') + '\n' +
  chalk.bold.white(' |  _ \\ / _ \\ |  \\| | \' /') + '\n' +
  chalk.bold.white(' | |_) / ___ \\| |\\  | . \\') + '\n' +
  chalk.bold.white(' |____/_/   \\_\\_| \\_|_|\\_\\') + '\n' +
  '\n' +
  '  ' + chalk.gray('On-chain bank for AI Agents') + '    ' + chalk.dim('v0.1.0') + '\n' +
  '  ' + chalk.gray('Powered by') + ' ' + chalk.blueBright('Base') + ' ' + chalk.gray('|') + ' ' + chalk.green('ERC-8004') + ' ' + chalk.gray('|') + ' ' + chalk.yellow('x402') + ' ' + chalk.gray('|') + ' ' + chalk.magenta('Aave V3') + '\n';

function showBanner() {
  const args = process.argv.slice(2);
  const isHelp = args.length === 0 || args.includes('--help') || args.includes('-h');
  if (isHelp) {
    console.log(LOGO);
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

program.parse();
