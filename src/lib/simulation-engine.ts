import { CreditModelParams, DEFAULT_MODEL } from './credit-model.js';
import {
  extractFeatures,
  calculateCreditScore,
  evaluateLoanApplication,
  updateModel,
  CreditFeatures,
} from './credit-engine.js';
import { generateAgents, getArchetypeCounts, SimAgent, AgentArchetype } from './simulation-agents.js';

// Deterministic PRNG (mulberry32)
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface EpochMetrics {
  epoch: number;
  applications: number;
  approvals: number;
  rejections: number;
  approvalRate: number;
  repayments: number;
  defaults: number;
  defaultRate: number;
  rollingDefaultRate: number;
  cumulativeDefaultRate: number;
  totalDisbursed: number;
  totalRepaid: number;
  totalDefaultLoss: number;
  netProfit: number;
  cumulativeProfit: number;
  modelVersion: number;
  avgCreditScore: number;
  agentProductivityAvg: number;
  archetypeDefaultRates: Record<AgentArchetype, number>;
}

export interface SimulationReport {
  seed: number;
  agentCount: number;
  epochCount: number;
  epochs: EpochMetrics[];
  finalModel: CreditModelParams;
  archetypeCounts: Record<AgentArchetype, number>;
  summary: {
    initialDefaultRate: number;
    finalDefaultRate: number;
    improvementPercent: number;
    totalProfit: number;
    totalLoanVolume: number;
    avgProductivityGrowth: number;
  };
}

function computeArchetypeDefaultRates(
  agents: SimAgent[],
): Record<AgentArchetype, number> {
  const rates: Record<AgentArchetype, { defaults: number; total: number }> = {
    excellent: { defaults: 0, total: 0 },
    good: { defaults: 0, total: 0 },
    average: { defaults: 0, total: 0 },
    risky: { defaults: 0, total: 0 },
    bad: { defaults: 0, total: 0 },
  };

  for (const agent of agents) {
    const total = agent.repaymentHistory.length;
    if (total === 0) continue;
    const defaults = agent.repaymentHistory.filter(r => r === 0).length;
    rates[agent.archetype].total += total;
    rates[agent.archetype].defaults += defaults;
  }

  const result: Record<AgentArchetype, number> = { excellent: 0, good: 0, average: 0, risky: 0, bad: 0 };
  for (const arch of Object.keys(result) as AgentArchetype[]) {
    result[arch] = rates[arch].total > 0 ? rates[arch].defaults / rates[arch].total : 0;
  }
  return result;
}

export async function runSimulation(
  config: { agents: number; epochs: number; seed: number },
  onEpochComplete?: (metrics: EpochMetrics, progress: number) => void,
): Promise<SimulationReport> {
  const rng = mulberry32(config.seed);
  const agents = generateAgents(config.agents, rng);
  let model: CreditModelParams = {
    ...DEFAULT_MODEL,
    weights: { ...DEFAULT_MODEL.weights },
  };
  const allEpochMetrics: EpochMetrics[] = [];
  let cumulativeProfit = 0;
  const initialProductivity = agents.reduce((s, a) => s + a.productivity, 0) / agents.length;

  // Rolling window for smoothed default rate
  const recentDefaults: number[] = [];
  const recentResolved: number[] = [];

  // Cumulative counters for overall default rate
  let cumulativeDefaults = 0;
  let cumulativeResolved = 0;

  for (let epoch = 1; epoch <= config.epochs; epoch++) {
    const outcomes: Array<{ features: CreditFeatures; repaid: boolean }> = [];
    let applications = 0;
    let approvals = 0;
    let rejections = 0;
    let repayments = 0;
    let defaults = 0;
    let epochDisbursed = 0;
    let epochRepaid = 0;
    let epochDefaultLoss = 0;

    // Update all agents' account age
    for (const agent of agents) {
      agent.accountAge = epoch;
    }

    // Phase 1: Loan applications
    for (const agent of agents) {
      if (rng() > agent.loanAppetite) continue;
      if (agent.activeLoans.length >= 3) continue;

      applications++;

      const features = extractFeatures({
        transactionCount: agent.transactionCount,
        repaymentHistory: agent.repaymentHistory,
        aaveDeposits: agent.aaveDeposits,
        identityRegistered: agent.identityRegistered,
        accountAge: agent.accountAge,
        totalBorrowed: agent.totalBorrowed,
        loanCount: agent.loanCount,
      });

      const score = calculateCreditScore(features, model);
      const maxPossible = ((score - 300) / 550) * model.maxLoanMultiplier;
      const requestAmount = Math.max(10, Math.min(250, Math.round(agent.requestMultiplier * maxPossible * 0.4)));

      const decision = evaluateLoanApplication(score, requestAmount, model);

      if (decision.approved) {
        approvals++;
        agent.activeLoans.push({
          amount: requestAmount,
          interestRate: decision.interestRate,
          disbursedAt: epoch,
          status: 'active',
        });
        agent.balance += requestAmount;
        agent.totalBorrowed += requestAmount;
        agent.loanCount++;
        epochDisbursed += requestAmount;
      } else {
        rejections++;
      }
    }

    // Phase 2: Resolve due loans (due next epoch)
    for (const agent of agents) {
      const stillActive: typeof agent.activeLoans = [];

      for (const loan of agent.activeLoans) {
        if (epoch - loan.disbursedAt < 1) {
          stillActive.push(loan);
          continue;
        }

        const features = extractFeatures({
          transactionCount: agent.transactionCount,
          repaymentHistory: agent.repaymentHistory,
          aaveDeposits: agent.aaveDeposits,
          identityRegistered: agent.identityRegistered,
          accountAge: agent.accountAge,
          totalBorrowed: agent.totalBorrowed,
          loanCount: agent.loanCount,
        });

        const willRepay = rng() < agent.trueRepayProbability;

        if (willRepay) {
          const interest = loan.amount * loan.interestRate;
          const totalOwed = loan.amount + interest;
          loan.status = 'repaid';
          agent.repaymentHistory.push(1);
          agent.transactionCount += 2;
          agent.totalRepaidAmount += totalOwed;
          agent.productivity += loan.amount * 0.2;
          agent.balance -= totalOwed;
          repayments++;
          epochRepaid += interest; // Only count interest as income
          outcomes.push({ features, repaid: true });
        } else {
          loan.status = 'defaulted';
          agent.repaymentHistory.push(0);
          defaults++;
          epochDefaultLoss += loan.amount; // Lost principal
          outcomes.push({ features, repaid: false });
        }
      }

      agent.activeLoans = stillActive;

      // Organic growth: some transactions, some Aave deposits
      agent.transactionCount += Math.floor(rng() * 3);
      if (rng() < 0.15 && agent.balance > 100) {
        const depositAmt = Math.round(agent.balance * 0.15);
        agent.aaveDeposits += depositAmt;
        agent.balance -= depositAmt;
      }
    }

    // Phase 3: Self-improvement — update model with SGD
    if (outcomes.length > 0) {
      model = updateModel(model, outcomes);
    }

    // Track rolling default rate (window of 5 epochs for smooth curve)
    const resolved = repayments + defaults;
    recentDefaults.push(defaults);
    recentResolved.push(resolved);
    if (recentDefaults.length > 5) {
      recentDefaults.shift();
      recentResolved.shift();
    }

    cumulativeDefaults += defaults;
    cumulativeResolved += resolved;

    const rollingDef = recentDefaults.reduce((a, b) => a + b, 0);
    const rollingRes = recentResolved.reduce((a, b) => a + b, 0);
    const rollingDefaultRate = rollingRes > 0 ? rollingDef / rollingRes : 0;
    const currentDefaultRate = resolved > 0 ? defaults / resolved : 0;

    // Adaptive threshold based on rolling default rate
    if (rollingDefaultRate > 0.25) {
      model.threshold = Math.min(model.threshold + 0.025, 0.72);
    } else if (rollingDefaultRate > 0.15) {
      model.threshold = Math.min(model.threshold + 0.01, 0.65);
    } else if (rollingDefaultRate < 0.08 && epoch > 5) {
      model.threshold = Math.max(model.threshold - 0.005, 0.38);
    }

    // Compute avg credit score
    let totalScore = 0;
    for (const agent of agents) {
      const f = extractFeatures({
        transactionCount: agent.transactionCount,
        repaymentHistory: agent.repaymentHistory,
        aaveDeposits: agent.aaveDeposits,
        identityRegistered: agent.identityRegistered,
        accountAge: agent.accountAge,
        totalBorrowed: agent.totalBorrowed,
        loanCount: agent.loanCount,
      });
      totalScore += calculateCreditScore(f, model);
    }

    const netProfit = epochRepaid - epochDefaultLoss; // Interest income minus default losses
    cumulativeProfit += netProfit;

    const cumulativeDefaultRate = cumulativeResolved > 0 ? cumulativeDefaults / cumulativeResolved : 0;

    const metrics: EpochMetrics = {
      epoch,
      applications,
      approvals,
      rejections,
      approvalRate: applications > 0 ? approvals / applications : 0,
      repayments,
      defaults,
      defaultRate: currentDefaultRate,
      rollingDefaultRate,
      cumulativeDefaultRate,
      totalDisbursed: epochDisbursed,
      totalRepaid: epochRepaid,
      totalDefaultLoss: epochDefaultLoss,
      netProfit,
      cumulativeProfit,
      modelVersion: model.version,
      avgCreditScore: Math.round(totalScore / agents.length),
      agentProductivityAvg: agents.reduce((s, a) => s + a.productivity, 0) / agents.length,
      archetypeDefaultRates: computeArchetypeDefaultRates(agents),
    };

    allEpochMetrics.push(metrics);

    if (onEpochComplete) {
      onEpochComplete(metrics, epoch / config.epochs);
    }

    // Small delay for visual effect
    await new Promise(r => setTimeout(r, 50));
  }

  // Build final report — use rolling rates for summary
  const epochsWithData = allEpochMetrics.filter(m => m.repayments + m.defaults > 0);
  const firstWithData = epochsWithData[0];
  // Use rolling rate from later epochs for the "final" rate (more stable)
  const lastWithData = epochsWithData[epochsWithData.length - 1];
  const finalProductivity = agents.reduce((s, a) => s + a.productivity, 0) / agents.length;

  const initialRate = firstWithData?.rollingDefaultRate ?? 0;
  const finalRate = lastWithData?.rollingDefaultRate ?? 0;

  return {
    seed: config.seed,
    agentCount: config.agents,
    epochCount: config.epochs,
    epochs: allEpochMetrics,
    finalModel: model,
    archetypeCounts: getArchetypeCounts(agents),
    summary: {
      initialDefaultRate: initialRate,
      finalDefaultRate: finalRate,
      improvementPercent:
        initialRate > 0
          ? ((initialRate - finalRate) / initialRate) * 100
          : 0,
      totalProfit: cumulativeProfit,
      totalLoanVolume: allEpochMetrics.reduce((s, m) => s + m.totalDisbursed, 0),
      avgProductivityGrowth: initialProductivity > 0 ? ((finalProductivity - initialProductivity) / initialProductivity) * 100 : 0,
    },
  };
}
