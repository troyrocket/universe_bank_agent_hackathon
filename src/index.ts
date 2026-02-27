#!/usr/bin/env node
import { Command } from 'commander';
import { registerWalletCommands } from './commands/wallet.js';
import { registerIdentityCommands } from './commands/identity.js';
import { registerPayCommands } from './commands/pay.js';
import { registerDepositCommands } from './commands/deposit.js';

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
