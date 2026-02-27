import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.universe-bank');

export function getConfigDir(): string {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  return CONFIG_DIR;
}

export function getWalletPath(): string {
  return join(getConfigDir(), 'wallet.json');
}

export function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

export function walletExists(): boolean {
  return existsSync(getWalletPath());
}

export interface AppConfig {
  agentId?: string;
  defaultNetwork?: 'mainnet' | 'testnet';
}

export function readConfig(): AppConfig {
  const path = getConfigPath();
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function writeConfig(config: AppConfig): void {
  const existing = readConfig();
  writeFileSync(getConfigPath(), JSON.stringify({ ...existing, ...config }, null, 2));
}
