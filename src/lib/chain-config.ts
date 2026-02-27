import { base, baseSepolia } from 'viem/chains';
import type { Chain } from 'viem';

export interface NetworkConfig {
  name: string;
  chain: Chain;
  rpcUrl: string;
  usdc: `0x${string}`;
  aavePool: `0x${string}`;
  aUsdc: `0x${string}`;
  identityRegistry: `0x${string}`;
  reputationRegistry: `0x${string}`;
}

export const NETWORKS: Record<'mainnet' | 'testnet', NetworkConfig> = {
  mainnet: {
    name: 'Base Mainnet',
    chain: base,
    rpcUrl: 'https://mainnet.base.org',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    aavePool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
    aUsdc: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB',
    identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
    reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
  },
  testnet: {
    name: 'Base Sepolia',
    chain: baseSepolia,
    rpcUrl: 'https://sepolia.base.org',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
    aavePool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5', // placeholder
    aUsdc: '0x0000000000000000000000000000000000000000', // placeholder
    identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
  },
};

export function getNetwork(network: string): NetworkConfig {
  if (network === 'mainnet' || network === 'testnet') {
    return NETWORKS[network];
  }
  throw new Error(`Unknown network: ${network}. Use "mainnet" or "testnet".`);
}
