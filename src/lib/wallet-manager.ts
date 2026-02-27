import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http, formatEther } from 'viem';
import { password as promptPassword } from '@inquirer/prompts';
import { getWalletPath, walletExists } from './config.js';
import type { NetworkConfig } from './chain-config.js';
import type { Account } from 'viem';

interface WalletFile {
  address: string;
  encryptedKey: string;
  iv: string;
  salt: string;
  authTag: string;
}

function encrypt(data: string, password: string): { encrypted: string; iv: string; salt: string; authTag: string } {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

function decrypt(encrypted: string, iv: string, salt: string, authTag: string, password: string): string {
  const key = scryptSync(password, Buffer.from(salt, 'base64'), 32);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function getPassword(): Promise<string> {
  const envPw = process.env.UNIVERSE_BANK_PASSWORD;
  if (envPw) return envPw;
  return promptPassword({ message: 'Enter wallet password:' });
}

export async function createWallet(): Promise<{ address: string }> {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const password = process.env.UNIVERSE_BANK_PASSWORD ||
    await promptPassword({ message: 'Set wallet password:' });

  const { encrypted, iv, salt, authTag } = encrypt(privateKey, password);

  const walletFile: WalletFile = {
    address: account.address,
    encryptedKey: encrypted,
    iv,
    salt,
    authTag,
  };

  writeFileSync(getWalletPath(), JSON.stringify(walletFile, null, 2));
  return { address: account.address };
}

export async function loadWallet(): Promise<{ account: Account; privateKey: `0x${string}` }> {
  // Check for direct private key env var
  const envKey = process.env.UNIVERSE_BANK_PRIVATE_KEY;
  if (envKey) {
    const key = (envKey.startsWith('0x') ? envKey : `0x${envKey}`) as `0x${string}`;
    return { account: privateKeyToAccount(key), privateKey: key };
  }

  if (!walletExists()) {
    throw new Error('No wallet found. Run "ubank wallet create" first.');
  }

  const walletFile: WalletFile = JSON.parse(readFileSync(getWalletPath(), 'utf-8'));
  const password = await getPassword();

  try {
    const privateKey = decrypt(
      walletFile.encryptedKey,
      walletFile.iv,
      walletFile.salt,
      walletFile.authTag,
      password,
    ) as `0x${string}`;
    return { account: privateKeyToAccount(privateKey), privateKey };
  } catch {
    throw new Error('Wrong password.');
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getClients(account: Account, network: NetworkConfig): { publicClient: any; walletClient: any } {
  const publicClient = createPublicClient({
    chain: network.chain,
    transport: http(network.rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain: network.chain,
    transport: http(network.rpcUrl),
  });
  return { publicClient, walletClient };
}

export async function getBalances(address: `0x${string}`, network: NetworkConfig) {
  const publicClient = createPublicClient({
    chain: network.chain,
    transport: http(network.rpcUrl),
  });

  const ethBalance = await publicClient.getBalance({ address });

  let usdcBalance = 0n;
  try {
    usdcBalance = await publicClient.readContract({
      address: network.usdc,
      abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }],
      functionName: 'balanceOf',
      args: [address],
    });
  } catch {
    // USDC contract may not exist on testnet
  }

  return {
    eth: formatEther(ethBalance),
    usdc: (Number(usdcBalance) / 1e6).toFixed(2),
  };
}
