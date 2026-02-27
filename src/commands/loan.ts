import { Command } from 'commander';
import chalk from 'chalk';
import * as log from '../utils/logger.js';
import { loadWallet } from '../lib/wallet-manager.js';
import { applyForLoan, repayLoan } from '../lib/loan-service.js';
import { loadLoanStore, getLoanSummary, getActiveLoans } from '../lib/loan-store.js';
import { renderTable } from '../utils/chart.js';

export function registerLoanCommands(program: Command) {
  const loan = program
    .command('loan')
    .description('Lending system');

  loan
    .command('apply <amount>')
    .description('Apply for a USDC loan')
    .action(async (amountStr) => {
      try {
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          log.error('Invalid amount');
          process.exit(1);
        }

        const { privateKey, account } = await loadWallet();
        const address = account.address;
        const s = log.spinner('Evaluating loan application...');

        const result = await applyForLoan(address, amount);
        s.stop();

        console.log();
        if (result.approved) {
          log.success(chalk.bold('Loan Approved!'));
          log.divider();
          log.label('Loan ID', result.loan!.id);
          log.label('Amount', `$${amount} USDC`);
          log.label('Interest Rate', `${(result.interestRate * 100).toFixed(2)}% APR`);
          log.label('Total Repayment', `$${(amount * (1 + result.interestRate)).toFixed(2)} USDC`);
          log.label('Credit Score', String(result.score));
          log.label('Credit Limit', `$${result.maxAmount} USDC`);
        } else {
          log.warn(chalk.bold('Loan Denied'));
          log.divider();
          log.label('Reason', chalk.red(result.reason));
          log.label('Credit Score', String(result.score));
          if (result.maxAmount > 0) {
            log.label('Max Eligible', `$${result.maxAmount} USDC`);
          }
        }
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });

  loan
    .command('status')
    .description('View active loans')
    .action(async () => {
      try {
        const { account } = await loadWallet();
        const address = account.address;
        const store = loadLoanStore();
        const active = getActiveLoans(store).filter(l => l.borrower === address);

        console.log();
        if (active.length === 0) {
          log.info('No active loans');
          return;
        }

        log.info(chalk.bold(`Active Loans (${active.length})`));
        log.divider();

        for (const loan of active) {
          const totalOwed = loan.amount * (1 + loan.interestRate);
          const remaining = totalOwed - loan.repaidAmount;
          log.label('Loan', loan.id);
          log.label('  Amount', `$${loan.amount} USDC`);
          log.label('  Rate', `${(loan.interestRate * 100).toFixed(2)}%`);
          log.label('  Remaining', chalk.yellow(`$${remaining.toFixed(2)} USDC`));
          console.log();
        }
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });

  loan
    .command('repay <amount>')
    .description('Repay a loan')
    .action(async (amountStr) => {
      try {
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          log.error('Invalid amount');
          process.exit(1);
        }

        const { account } = await loadWallet();
        const address = account.address;
        const s = log.spinner('Processing repayment...');
        const result = repayLoan(address, amount);
        s.stop();

        console.log();
        log.success(chalk.bold('Repayment Processed'));
        log.divider();
        log.label('Loan', result.loan.id);
        log.label('Amount Applied', `$${result.amountApplied.toFixed(2)} USDC`);

        if (result.fullyRepaid) {
          log.success('Loan fully repaid! Credit score improved.');
        } else {
          log.label('Remaining Balance', chalk.yellow(`$${result.remainingBalance.toFixed(2)} USDC`));
        }
      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });

  loan
    .command('list')
    .description('List all loans')
    .action(async () => {
      try {
        const store = loadLoanStore();
        const summary = getLoanSummary(store);

        console.log();
        log.info(chalk.bold('Loan History'));
        log.divider();

        if (store.loans.length === 0) {
          log.info('No loans yet');
          return;
        }

        const headers = ['ID', 'Amount', 'Rate', 'Status', 'Score'];
        const rows = store.loans.map(l => {
          const statusColor =
            l.status === 'repaid' ? chalk.green :
            l.status === 'defaulted' ? chalk.red :
            chalk.yellow;
          return [
            l.id,
            `$${l.amount}`,
            `${(l.interestRate * 100).toFixed(1)}%`,
            statusColor(l.status),
            String(l.creditScoreAtOrigination),
          ];
        });

        console.log(renderTable(headers, rows));
        console.log();

        log.label('Total Disbursed', `$${summary.totalDisbursed.toFixed(2)}`);
        log.label('Total Repaid', chalk.green(`$${summary.totalRepaid.toFixed(2)}`));
        log.label('Total Defaulted', chalk.red(`$${summary.totalDefaulted.toFixed(2)}`));
        log.label('Active Balance', chalk.yellow(`$${summary.activeBalance.toFixed(2)}`));

      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });
}
