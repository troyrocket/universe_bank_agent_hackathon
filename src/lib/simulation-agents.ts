import { Loan } from './loan-store.js';

export type AgentArchetype = 'excellent' | 'good' | 'average' | 'risky' | 'bad';

export interface SimAgent {
  id: number;
  name: string;
  archetype: AgentArchetype;
  // Observable on-chain features
  balance: number;
  transactionCount: number;
  repaymentHistory: number[];
  aaveDeposits: number;
  identityRegistered: boolean;
  accountAge: number;
  // Hidden behavioral params (model must learn to infer these)
  trueRepayProbability: number;
  loanAppetite: number;
  requestMultiplier: number;
  // State
  activeLoans: SimLoan[];
  totalBorrowed: number;
  totalRepaidAmount: number;
  productivity: number;
  loanCount: number;
}

export interface SimLoan {
  amount: number;
  interestRate: number;
  disbursedAt: number;
  status: 'active' | 'repaid' | 'defaulted';
}

interface ArchetypeConfig {
  repayProbRange: [number, number];
  appetiteRange: [number, number];
  requestMultRange: [number, number];
  balanceRange: [number, number];
  txCountRange: [number, number];
  identityProb: number;
  aaveRange: [number, number];
}

const ARCHETYPE_CONFIGS: Record<AgentArchetype, ArchetypeConfig> = {
  excellent: {
    repayProbRange: [0.95, 1.0],
    appetiteRange: [0.7, 0.9],
    requestMultRange: [0.3, 0.5],
    balanceRange: [5000, 10000],
    txCountRange: [80, 200],
    identityProb: 0.98,
    aaveRange: [2000, 8000],
  },
  good: {
    repayProbRange: [0.82, 0.95],
    appetiteRange: [0.6, 0.8],
    requestMultRange: [0.3, 0.6],
    balanceRange: [2000, 6000],
    txCountRange: [30, 100],
    identityProb: 0.85,
    aaveRange: [500, 3000],
  },
  average: {
    repayProbRange: [0.55, 0.75],
    appetiteRange: [0.5, 0.7],
    requestMultRange: [0.4, 0.7],
    balanceRange: [500, 3000],
    txCountRange: [5, 40],
    identityProb: 0.45,
    aaveRange: [0, 500],
  },
  risky: {
    repayProbRange: [0.20, 0.45],
    appetiteRange: [0.75, 0.95],
    requestMultRange: [0.7, 1.0],
    balanceRange: [50, 800],
    txCountRange: [0, 10],
    identityProb: 0.10,
    aaveRange: [0, 50],
  },
  bad: {
    repayProbRange: [0.02, 0.18],
    appetiteRange: [0.9, 1.0],
    requestMultRange: [0.9, 1.5],
    balanceRange: [0, 100],
    txCountRange: [0, 3],
    identityProb: 0.02,
    aaveRange: [0, 0],
  },
};

// Distribution: 15% excellent, 25% good, 30% average, 20% risky, 10% bad
const ARCHETYPE_DISTRIBUTION: [AgentArchetype, number][] = [
  ['excellent', 0.15],
  ['good', 0.25],
  ['average', 0.30],
  ['risky', 0.20],
  ['bad', 0.10],
];

function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function createAgent(id: number, archetype: AgentArchetype, rng: () => number): SimAgent {
  const cfg = ARCHETYPE_CONFIGS[archetype];
  return {
    id,
    name: `Agent-${String(id).padStart(3, '0')}`,
    archetype,
    balance: Math.round(randRange(rng, ...cfg.balanceRange)),
    transactionCount: Math.round(randRange(rng, ...cfg.txCountRange)),
    repaymentHistory: [],
    aaveDeposits: Math.round(randRange(rng, ...cfg.aaveRange)),
    identityRegistered: rng() < cfg.identityProb,
    accountAge: 0,
    trueRepayProbability: randRange(rng, ...cfg.repayProbRange),
    loanAppetite: randRange(rng, ...cfg.appetiteRange),
    requestMultiplier: randRange(rng, ...cfg.requestMultRange),
    activeLoans: [],
    totalBorrowed: 0,
    totalRepaidAmount: 0,
    productivity: Math.round(randRange(rng, ...cfg.balanceRange) * 0.5),
    loanCount: 0,
  };
}

export function generateAgents(count: number, rng: () => number): SimAgent[] {
  const agents: SimAgent[] = [];

  for (const [archetype, ratio] of ARCHETYPE_DISTRIBUTION) {
    const n = Math.round(count * ratio);
    for (let i = 0; i < n; i++) {
      agents.push(createAgent(agents.length, archetype, rng));
    }
  }

  // Fill to exact count if rounding caused mismatch
  while (agents.length < count) {
    agents.push(createAgent(agents.length, 'average', rng));
  }
  // Trim if over
  while (agents.length > count) {
    agents.pop();
  }

  return agents;
}

export function getArchetypeCounts(agents: SimAgent[]): Record<AgentArchetype, number> {
  const counts: Record<AgentArchetype, number> = { excellent: 0, good: 0, average: 0, risky: 0, bad: 0 };
  for (const a of agents) counts[a.archetype]++;
  return counts;
}
