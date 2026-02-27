import chalk from 'chalk';
import ora from 'ora';

export function info(msg: string) {
  console.log(chalk.blue('ℹ'), msg);
}

export function success(msg: string) {
  console.log(chalk.green('✓'), msg);
}

export function error(msg: string) {
  console.log(chalk.red('✗'), msg);
}

export function warn(msg: string) {
  console.log(chalk.yellow('⚠'), msg);
}

export function spinner(text: string) {
  return ora({ text, spinner: 'dots' }).start();
}

export function label(key: string, value: string) {
  console.log(`  ${chalk.gray(key + ':')} ${value}`);
}

export function divider(length = 50) {
  console.log(chalk.gray('━'.repeat(length)));
}
