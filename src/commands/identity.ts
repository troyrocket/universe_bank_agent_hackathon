import type { Command } from 'commander';
import { loadWallet } from '../lib/wallet-manager.js';
import { getNetwork } from '../lib/chain-config.js';
import { registerIdentity, getIdentityInfo } from '../lib/identity-service.js';
import { readConfig, writeConfig } from '../lib/config.js';
import * as log from '../utils/logger.js';

export function registerIdentityCommands(program: Command) {
  const identity = program.command('identity').description('On-chain identity (ERC-8004)');

  identity
    .command('register')
    .description('Register an on-chain identity')
    .requiredOption('--name <name>', 'Agent name')
    .option('--description <desc>', 'Agent description', '')
    .option('-n, --network <network>', 'Network (mainnet|testnet)', 'testnet')
    .action(async (opts) => {
      try {
        const { privateKey, account } = await loadWallet();
        const network = getNetwork(opts.network);

        log.info(`Registering identity on ${network.name}...`);
        const s = log.spinner('Sending transaction...');

        const { agentId, txHash } = await registerIdentity(
          privateKey,
          { name: opts.name, description: opts.description },
          network,
        );

        s.succeed('Identity registered!');
        log.label('Agent ID', agentId);
        log.label('TX', txHash);
        log.label('Owner', account.address);

        writeConfig({ agentId });
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });

  identity
    .command('info')
    .description('Show identity info')
    .option('-n, --network <network>', 'Network (mainnet|testnet)', 'testnet')
    .action(async (opts) => {
      try {
        const { account } = await loadWallet();
        const network = getNetwork(opts.network);

        const s = log.spinner('Querying identity...');
        const info = await getIdentityInfo(account.address, network);
        s.stop();

        if (!info) {
          log.warn('No identity found for this wallet. Run "ubank identity register" first.');
          return;
        }

        log.success('Identity found');
        log.label('Agent ID', info.agentId);
        log.label('URI', info.uri.length > 80 ? info.uri.slice(0, 80) + '...' : info.uri);

        const config = readConfig();
        if (config.agentId) {
          log.label('Stored Agent ID', config.agentId);
        }
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });
}
