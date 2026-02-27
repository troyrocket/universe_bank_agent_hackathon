import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync } from 'node:fs';
import * as log from '../utils/logger.js';
import { renderLineChart, renderDualChart, renderTable, renderBox } from '../utils/chart.js';
import { runSimulation, EpochMetrics } from '../lib/simulation-engine.js';
import { getSimulationReportPath } from '../lib/config.js';
import { AgentArchetype } from '../lib/simulation-agents.js';

export function registerSimulateCommands(program: Command) {
  const simulate = program
    .command('simulate')
    .description('Credit system simulation & evaluation');

  simulate
    .command('run')
    .description('Run credit system simulation with AI agents')
    .option('--agents <count>', 'Number of AI agents', '100')
    .option('--epochs <count>', 'Number of simulation epochs', '24')
    .option('--seed <seed>', 'Random seed for reproducibility', '42')
    .action(async (opts) => {
      try {
        const agentCount = parseInt(opts.agents);
        const epochCount = parseInt(opts.epochs);
        const seed = parseInt(opts.seed);

        console.log();
        console.log(renderBox(
          'UNIVERSE BANK — Credit System Simulation',
          [
            '',
            `  ${chalk.gray('Agents:')} ${chalk.bold(String(agentCount))}  ${chalk.gray('│')}  ${chalk.gray('Epochs:')} ${chalk.bold(String(epochCount))}  ${chalk.gray('│')}  ${chalk.gray('Seed:')} ${chalk.bold(String(seed))}`,
            '',
          ],
        ));
        console.log();

        const s = log.spinner(`Simulating epoch 1/${epochCount}...`);

        const epochHistory: EpochMetrics[] = [];

        const report = await runSimulation(
          { agents: agentCount, epochs: epochCount, seed },
          (metrics, progress) => {
            epochHistory.push(metrics);
            const pct = Math.round(progress * 100);
            const bar = '█'.repeat(Math.round(progress * 20)) + '░'.repeat(20 - Math.round(progress * 20));
            s.text = `Simulating epoch ${metrics.epoch}/${epochCount}... [${bar}] ${pct}%`;
          },
        );

        s.succeed(`Simulation complete! ${epochCount} epochs processed.`);
        console.log();

        // === Epoch Summary Table ===
        // Show key epochs: 1, every 3rd, and last
        const keyEpochs = report.epochs.filter((m, i) =>
          i === 0 || (i + 1) % 3 === 0 || i === report.epochs.length - 1,
        );

        const tableHeaders = ['Epoch', 'Default%', 'Rolling%', 'Approved', 'Rejected', 'Profit', 'Model'];
        const tableRows = keyEpochs.map(m => [
          String(m.epoch),
          formatDefaultRate(m.defaultRate),
          formatDefaultRate(m.rollingDefaultRate),
          String(m.approvals),
          String(m.rejections),
          formatMoney(m.netProfit),
          `v${m.modelVersion}`,
        ]);

        console.log(renderTable(tableHeaders, tableRows));
        console.log();

        // === Chart 1: Default Rate Over Time (rolling for smooth curve) ===
        const defaultRates = report.epochs.map(m => m.rollingDefaultRate * 100);
        console.log(renderLineChart(defaultRates, {
          title: 'Default Rate Over Time (Self-Improving Credit Model)',
          yLabel: 'Lower is better — model learns to reject bad borrowers',
          yFormat: (v) => `${v.toFixed(0)}%`,
          xLabel: 'Epoch',
          color: (s) => chalk.red(s),
          height: 14,
        }));
        console.log();

        // === Chart 2: Agent Productivity Growth ===
        const productivity = report.epochs.map(m => m.agentProductivityAvg);
        console.log(renderLineChart(productivity, {
          title: 'Agent Productivity Growth (Borrowing Expands Capacity)',
          yLabel: 'Agents who borrow and repay grow their productive capacity',
          yFormat: (v) => `$${abbreviateNumber(v)}`,
          xLabel: 'Epoch',
          color: (s) => chalk.cyan(s),
          height: 10,
        }));
        console.log();

        // === Archetype Breakdown (cumulative rates at end) ===
        const archetypes: AgentArchetype[] = ['excellent', 'good', 'average', 'risky', 'bad'];
        const lastEpoch = report.epochs[report.epochs.length - 1];

        const archHeaders = ['Archetype', 'Count', 'True Def%', 'Approved%', 'Status'];
        const archRows = archetypes.map(a => {
          const count = report.archetypeCounts[a];
          const defRate = lastEpoch.archetypeDefaultRates[a];
          // Compute how many of this archetype were approved in last 5 epochs
          const recentEpochs = report.epochs.slice(-5);
          const defStr = `${(defRate * 100).toFixed(1)}%`;
          const defColored = defRate > 0.5 ? chalk.red(defStr) : defRate > 0.2 ? chalk.yellow(defStr) : chalk.green(defStr);

          // Determine if model learned to handle this archetype
          let status: string;
          if (defRate < 0.1) status = chalk.green('Correctly approved');
          else if (defRate < 0.3) status = chalk.yellow('Mostly approved');
          else if (defRate > 0.7) status = chalk.green('Correctly rejected');
          else status = chalk.yellow('Learning...');

          return [
            archetypeColor(a),
            String(count),
            defColored,
            '-',
            status,
          ];
        });
        console.log(renderTable(archHeaders, archRows));
        console.log();

        // === Final Summary ===
        log.divider();
        log.success(`Default rate improved: ${(report.summary.initialDefaultRate * 100).toFixed(1)}% → ${(report.summary.finalDefaultRate * 100).toFixed(1)}% (${chalk.green(`-${report.summary.improvementPercent.toFixed(1)}%`)})`);
        log.success(`Model self-improved through ${report.finalModel.version} training cycles (${report.finalModel.trainingSamples} samples)`);
        log.success(`Agent productivity grew ${chalk.bold(`${report.summary.avgProductivityGrowth.toFixed(0)}%`)} on average`);
        log.success(`Total loan volume: ${chalk.bold(`$${abbreviateNumber(report.summary.totalLoanVolume)}`)}`);
        log.success(`Net profit: ${chalk.bold(formatMoney(report.summary.totalProfit))}`);
        console.log();

        // === Key Model Weights (learned) ===
        log.info(chalk.bold('Learned Model Weights (most important features):'));
        const w = report.finalModel.weights;
        const weightEntries = [
          ['Repayment Rate', w.repaymentRate],
          ['Identity Verified', w.identityRegistered],
          ['Aave Deposits', w.aaveDeposits],
          ['Transaction Count', w.transactionCount],
          ['Account Age', w.accountAge],
          ['Avg Loan Size', w.avgLoanSize],
        ].sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number));

        for (const [name, weight] of weightEntries) {
          const w = weight as number;
          const bar = w > 0
            ? chalk.green('█'.repeat(Math.min(20, Math.round(Math.abs(w) * 3))))
            : chalk.red('█'.repeat(Math.min(20, Math.round(Math.abs(w) * 3))));
          log.label(`  ${name as string}`, `${bar} ${w > 0 ? '+' : ''}${w.toFixed(3)}`);
        }
        console.log();

        // Save report
        const reportPath = getSimulationReportPath();
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        log.info(`Full report saved to ${chalk.gray(reportPath)}`);
        console.log();

      } catch (err: any) {
        log.error(err.message);
        process.exit(1);
      }
    });
}

function formatDefaultRate(rate: number): string {
  const pct = rate * 100;
  const str = `${pct.toFixed(1)}%`;
  if (pct > 20) return chalk.red(str);
  if (pct > 10) return chalk.yellow(str);
  return chalk.green(str);
}

function formatMoney(amount: number): string {
  const str = `$${Math.abs(amount).toFixed(0)}`;
  if (amount < 0) return chalk.red(`-${str}`);
  return chalk.green(`+${str}`);
}

function abbreviateNumber(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}

function archetypeColor(a: AgentArchetype): string {
  switch (a) {
    case 'excellent': return chalk.green(a);
    case 'good': return chalk.cyan(a);
    case 'average': return chalk.yellow(a);
    case 'risky': return chalk.hex('#FF8C00')(a);
    case 'bad': return chalk.red(a);
  }
}
