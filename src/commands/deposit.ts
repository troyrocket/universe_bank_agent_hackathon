import type { Command } from 'commander';
import { loadWallet } from '../lib/wallet-manager.js';
import { getNetwork } from '../lib/chain-config.js';
import { supplyToAave, getAUsdcBalance, withdrawFromAave } from '../lib/deposit-service.js';
import * as log from '../utils/logger.js';

export function registerDepositCommands(program: Command) {
  const deposit = program.command('deposit').description('Aave V3 yield deposits');

  deposit
    .command('supply <amount>')
    .description('Deposit USDC into Aave V3 to earn yield')
    .option('-n, --network <network>', 'Network (mainnet|testnet)', 'testnet')
    .action(async (amount: string, opts) => {
      try {
        const { account } = await loadWallet();
        const network = getNetwork(opts.network);

        log.info(`Supplying ${amount} USDC to Aave V3 on ${network.name}...`);

        const s1 = log.spinner('Approving USDC spend...');
        const { approveTx, supplyTx } = await supplyToAave(account, amount, network);
        s1.succeed('USDC approved');

        log.success(`Supplied ${amount} USDC to Aave V3`);
        log.label('Approve TX', approveTx);
        log.label('Supply TX', supplyTx);
        log.info('Your aUSDC balance will grow over time (~4-7% APY)');
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });

  deposit
    .command('balance')
    .description('Show aUSDC balance (includes accrued yield)')
    .option('-n, --network <network>', 'Network (mainnet|testnet)', 'testnet')
    .action(async (opts) => {
      try {
        const { account } = await loadWallet();
        const network = getNetwork(opts.network);

        const s = log.spinner('Fetching balance...');
        const balance = await getAUsdcBalance(account, network);
        s.stop();

        log.success('Aave V3 Position');
        log.label('aUSDC balance', `${balance} USDC (includes accrued yield)`);
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });

  deposit
    .command('withdraw <amount>')
    .description('Withdraw USDC from Aave V3')
    .option('-n, --network <network>', 'Network (mainnet|testnet)', 'testnet')
    .action(async (amount: string, opts) => {
      try {
        const { account } = await loadWallet();
        const network = getNetwork(opts.network);

        log.info(`Withdrawing ${amount} USDC from Aave V3 on ${network.name}...`);
        const s = log.spinner('Processing withdrawal...');
        const { txHash } = await withdrawFromAave(account, amount, network);
        s.succeed('Withdrawal complete');

        log.success(`Withdrew ${amount} USDC`);
        log.label('TX', txHash);
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });
}
