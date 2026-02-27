import { ethers } from 'ethers';
import type { NetworkConfig } from './chain-config.js';

const IDENTITY_REGISTRY_ABI = [
  'function register(string agentURI) external returns (uint256 agentId)',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'event Registered(uint256 indexed agentId, string agentURI, address indexed owner)',
];

export interface RegistrationData {
  name: string;
  description: string;
}

export async function registerIdentity(
  privateKey: string,
  data: RegistrationData,
  network: NetworkConfig,
): Promise<{ agentId: string; txHash: string }> {
  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const registrationJson = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: data.name,
    description: data.description,
    services: [],
    x402Support: true,
    active: true,
    registrations: [],
    supportedTrust: ['reputation'],
  };

  const base64Data = Buffer.from(JSON.stringify(registrationJson)).toString('base64');
  const dataUri = `data:application/json;base64,${base64Data}`;

  const contract = new ethers.Contract(network.identityRegistry, IDENTITY_REGISTRY_ABI, signer);
  const tx = await contract.register(dataUri);
  const receipt = await tx.wait();

  // Parse agentId from Registered event
  let agentId = '0';
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed && parsed.name === 'Registered') {
        agentId = parsed.args.agentId.toString();
        break;
      }
    } catch {
      // skip logs from other contracts
    }
  }

  return { agentId, txHash: receipt.hash };
}

export async function getIdentityInfo(
  address: string,
  network: NetworkConfig,
): Promise<{ agentId: string; uri: string } | null> {
  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const contract = new ethers.Contract(network.identityRegistry, IDENTITY_REGISTRY_ABI, provider);

  try {
    const balance = await contract.balanceOf(address);
    if (balance === 0n) return null;

    const agentId = await contract.tokenOfOwnerByIndex(address, 0);
    const uri = await contract.tokenURI(agentId);
    return { agentId: agentId.toString(), uri };
  } catch {
    return null;
  }
}
