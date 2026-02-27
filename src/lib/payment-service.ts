import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { toClientEvmSigner } from '@x402/evm';
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

export async function makePayment(
  privateKey: `0x${string}`,
  url: string,
): Promise<{ status: number; body: string; paid: boolean }> {
  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org'),
  });

  const signer = toClientEvmSigner(account, publicClient);
  const client = new x402Client();
  registerExactEvmScheme(client, { signer });

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);
  const response = await fetchWithPayment(url);
  const body = await response.text();

  return {
    status: response.status,
    body,
    paid: response.headers.has('payment-response'),
  };
}
