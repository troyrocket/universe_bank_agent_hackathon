import type { Command } from 'commander';
import { createWallet, loadWallet, getBalances } from '../lib/wallet-manager.js';
import { getNetwork } from '../lib/chain-config.js';
import { walletExists, getWalletPath } from '../lib/config.js';
import * as log from '../utils/logger.js';

export function registerWalletCommands(program: Command) {
  const wallet = program.command('wallet').description('Wallet management');

  wallet
    .command('create')
    .description('Create a new wallet')
    .action(async () => {
      if (walletExists()) {
        log.warn('Wallet already exists at ' + getWalletPath());
        log.warn('Creating a new wallet will overwrite the existing one.');
      }

      try {
        const { address } = await createWallet();
        log.success('Wallet created!');
        log.label('Address', address);
        log.label('Saved to', getWalletPath());
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });

  wallet
    .command('info')
    .description('Show wallet address and balances')
    .option('-n, --network <network>', 'Network (mainnet|testnet)', 'testnet')
    .action(async (opts) => {
      try {
        const { account } = await loadWallet();
        const network = getNetwork(opts.network);

        log.info(`Wallet on ${network.name}`);
        log.label('Address', account.address);

        const s = log.spinner('Fetching balances...');
        const balances = await getBalances(account.address, network);
        s.stop();

        log.label('ETH', balances.eth);
        log.label('USDC', balances.usdc);
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });

  wallet
    .command('export')
    .description('Export private key (requires password)')
    .action(async () => {
      try {
        const { privateKey } = await loadWallet();
        log.warn('Keep this private key safe. Never share it.');
        console.log(privateKey);
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });
}
