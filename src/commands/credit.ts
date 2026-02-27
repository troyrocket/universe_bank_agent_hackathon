import { Command } from 'commander';
import chalk from 'chalk';
import * as log from '../utils/logger.js';
import { loadModel } from '../lib/credit-model.js';
import { extractFeatures, calculateCreditScore } from '../lib/credit-engine.js';
import { loadLoanStore } from '../lib/loan-store.js';
import { loadWallet } from '../lib/wallet-manager.js';
import { readConfig } from '../lib/config.js';

export function registerCreditCommands(program: Command) {
  const credit = program
    .command('credit')
    .description('Credit scoring system');

  credit
    .command('score')
    .description('View your credit score')
    .action(async () => {
      try {
        await loadWallet();
        const s = log.spinner('Calculating credit score...');

        const config = readConfig();
        const store = loadLoanStore();

        const myLoans = store.loans;
        const repaymentHistory = myLoans
          .filter(l => l.status !== 'active')
          .map(l => l.status === 'repaid' ? 1 : 0);

        const features = extractFeatures({
          transactionCount: myLoans.length * 2 + 5,
          repaymentHistory,
          aaveDeposits: 0,
          identityRegistered: !!config.agentId,
          accountAge: 1,
          totalBorrowed: myLoans.reduce((s, l) => s + l.amount, 0),
          loanCount: myLoans.length,
        });

        const model = loadModel();
        const score = calculateCreditScore(features, model);
        s.stop();

        console.log();
        log.info(chalk.bold('Credit Score Report'));
        log.divider();

        const scoreColor = score >= 700 ? chalk.green : score >= 550 ? chalk.yellow : chalk.red;
        console.log('  ' + chalk.gray('Score:') + ' ' + scoreColor(chalk.bold(String(score))) + chalk.gray('/850'));
        console.log();

        log.label('Transaction Activity', `${(features.transactionCount * 100).toFixed(0)}%`);
        log.label('Repayment Rate', `${(features.repaymentRate * 100).toFixed(1)}%`);
        log.label('DeFi Engagement', `${(features.aaveDeposits * 100).toFixed(0)}%`);
        log.label('Identity Verified', features.identityRegistered ? chalk.green('Yes') : chalk.red('No'));
        log.label('Account Age', `${(features.accountAge * 20).toFixed(0)} periods`);
        log.label('Model Version', `v${model.version}`);

        console.log();
        const maxLoan = Math.round(((score - 300) / 550) * model.maxLoanMultiplier);
        log.label('Max Loan Eligible', chalk.bold(`$${maxLoan} USDC`));

      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });

  credit
    .command('model')
    .description('View credit model parameters')
    .action(async () => {
      try {
        const model = loadModel();

        console.log();
        log.info(chalk.bold('Credit Model Parameters'));
        log.divider();

        log.label('Version', `v${model.version}`);
        log.label('Training Samples', String(model.trainingSamples));
        log.label('Learning Rate', String(model.learningRate));
        log.label('Approval Threshold', String(model.threshold));
        console.log();

        log.info('Feature Weights:');
        const w = model.weights;
        log.label('  Transaction Count', colorWeight(w.transactionCount));
        log.label('  Repayment Rate', colorWeight(w.repaymentRate));
        log.label('  Aave Deposits', colorWeight(w.aaveDeposits));
        log.label('  Identity Registered', colorWeight(w.identityRegistered));
        log.label('  Account Age', colorWeight(w.accountAge));
        log.label('  Avg Loan Size', colorWeight(w.avgLoanSize));
        log.label('  Bias', colorWeight(model.bias));
        console.log();

        log.label('Base Interest Rate', `${(model.baseInterestRate * 100).toFixed(1)}%`);
        log.label('Risk Premium Factor', `${(model.riskPremiumFactor * 100).toFixed(1)}%`);
        log.label('Max Loan Multiplier', `$${model.maxLoanMultiplier}`);

      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });
}

function colorWeight(w: number): string {
  const str = w.toFixed(4);
  if (w > 0) return chalk.green('+' + str);
  if (w < 0) return chalk.red(str);
  return chalk.gray(str);
}
