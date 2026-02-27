import type { Command } from 'commander';
import { loadWallet } from '../lib/wallet-manager.js';
import { makePayment } from '../lib/payment-service.js';
import * as log from '../utils/logger.js';

export function registerPayCommands(program: Command) {
  program
    .command('pay <url>')
    .description('Make an x402 payment request')
    .action(async (url: string) => {
      try {
        const { privateKey } = await loadWallet();

        log.info(`Requesting ${url}...`);
        const s = log.spinner('Processing...');

        const result = await makePayment(privateKey, url);
        s.stop();

        if (result.paid) {
          log.success(`Payment completed. Status: ${result.status}`);
        } else {
          log.info(`Response received (no payment required). Status: ${result.status}`);
        }

        console.log(result.body);
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });
}
