import { parseUnits, formatUnits } from 'viem';
import { ERC20_ABI } from '../abi/erc20.js';
import { AAVE_POOL_ABI } from '../abi/aave-pool.js';
import type { NetworkConfig } from './chain-config.js';
import type { Account } from 'viem';
import { getClients } from './wallet-manager.js';

export async function supplyToAave(
  account: Account,
  amount: string,
  network: NetworkConfig,
): Promise<{ approveTx: string; supplyTx: string }> {
  const { publicClient, walletClient } = getClients(account, network);
  const amountWei = parseUnits(amount, 6); // USDC 6 decimals

  // Check USDC balance
  const balance = await publicClient.readContract({
    address: network.usdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  if (balance < amountWei) {
    throw new Error(
      `Insufficient USDC balance. Have: ${formatUnits(balance, 6)}, Need: ${amount}`
    );
  }

  // Approve
  const approveTx = await walletClient.writeContract({
    address: network.usdc,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [network.aavePool, amountWei],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTx });

  // Supply
  const supplyTx = await walletClient.writeContract({
    address: network.aavePool,
    abi: AAVE_POOL_ABI,
    functionName: 'supply',
    args: [network.usdc, amountWei, account.address, 0],
  });
  await publicClient.waitForTransactionReceipt({ hash: supplyTx });

  return { approveTx, supplyTx };
}

export async function getAUsdcBalance(
  account: Account,
  network: NetworkConfig,
): Promise<string> {
  const { publicClient } = getClients(account, network);

  const balance = await publicClient.readContract({
    address: network.aUsdc,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  return formatUnits(balance, 6);
}

export async function withdrawFromAave(
  account: Account,
  amount: string,
  network: NetworkConfig,
): Promise<{ txHash: string }> {
  const { publicClient, walletClient } = getClients(account, network);
  const amountWei = parseUnits(amount, 6);

  const txHash = await walletClient.writeContract({
    address: network.aavePool,
    abi: AAVE_POOL_ABI,
    functionName: 'withdraw',
    args: [network.usdc, amountWei, account.address],
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return { txHash };
}
