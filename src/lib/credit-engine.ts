import { CreditModelParams, CreditWeights } from './credit-model.js';

export interface CreditFeatures {
  transactionCount: number;
  repaymentRate: number;
  aaveDeposits: number;
  identityRegistered: number;
  accountAge: number;
  avgLoanSize: number;
}

export interface LoanDecision {
  approved: boolean;
  score: number;
  maxAmount: number;
  interestRate: number;
  reason: string;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function dotProduct(weights: CreditWeights, features: CreditFeatures): number {
  return (
    weights.transactionCount * features.transactionCount +
    weights.repaymentRate * features.repaymentRate +
    weights.aaveDeposits * features.aaveDeposits +
    weights.identityRegistered * features.identityRegistered +
    weights.accountAge * features.accountAge +
    weights.avgLoanSize * features.avgLoanSize
  );
}

/** Normalize raw agent data into 0-1 features */
export function extractFeatures(raw: {
  transactionCount: number;
  repaymentHistory: number[];
  aaveDeposits: number;
  identityRegistered: boolean;
  accountAge: number;
  totalBorrowed: number;
  loanCount: number;
}): CreditFeatures {
  const repaid = raw.repaymentHistory.filter(r => r === 1).length;
  const total = raw.repaymentHistory.length;

  return {
    transactionCount: Math.min(raw.transactionCount / 100, 1),
    repaymentRate: total > 0 ? repaid / total : 0.5,
    aaveDeposits: Math.min(raw.aaveDeposits / 10000, 1),
    identityRegistered: raw.identityRegistered ? 1 : 0,
    accountAge: Math.min(raw.accountAge / 20, 1),
    avgLoanSize: raw.loanCount > 0 ? Math.min((raw.totalBorrowed / raw.loanCount) / 5000, 1) : 0,
  };
}

/** Calculate credit score (300-850 range) */
export function calculateCreditScore(features: CreditFeatures, model: CreditModelParams): number {
  const raw = dotProduct(model.weights, features) + model.bias;
  const probability = sigmoid(raw);
  return Math.round(300 + probability * 550);
}

/** Evaluate a loan application */
export function evaluateLoanApplication(
  score: number,
  requestedAmount: number,
  model: CreditModelParams,
): LoanDecision {
  const probability = (score - 300) / 550;

  if (probability < model.threshold) {
    return {
      approved: false,
      score,
      maxAmount: 0,
      interestRate: 0,
      reason: `Credit score ${score} below minimum threshold (need ${Math.round(300 + model.threshold * 550)}+)`,
    };
  }

  const maxAmount = Math.round(probability * model.maxLoanMultiplier);
  const riskDiscount = 1 - probability;
  const interestRate = model.baseInterestRate + riskDiscount * model.riskPremiumFactor;

  if (requestedAmount > maxAmount) {
    return {
      approved: false,
      score,
      maxAmount,
      interestRate: Math.round(interestRate * 10000) / 10000,
      reason: `Requested $${requestedAmount} exceeds credit limit of $${maxAmount}`,
    };
  }

  return {
    approved: true,
    score,
    maxAmount,
    interestRate: Math.round(interestRate * 10000) / 10000,
    reason: 'Approved',
  };
}

/** Self-improvement: update model via online SGD on loan outcomes */
export function updateModel(
  model: CreditModelParams,
  outcomes: Array<{ features: CreditFeatures; repaid: boolean }>,
): CreditModelParams {
  if (outcomes.length === 0) return model;

  const newWeights = { ...model.weights };
  let newBias = model.bias;
  const lr = model.learningRate;

  for (const { features, repaid } of outcomes) {
    const raw = dotProduct(model.weights, features) + model.bias;
    const predicted = sigmoid(raw);
    const target = repaid ? 1 : 0;
    const error = predicted - target;

    newWeights.transactionCount -= lr * error * features.transactionCount;
    newWeights.repaymentRate -= lr * error * features.repaymentRate;
    newWeights.aaveDeposits -= lr * error * features.aaveDeposits;
    newWeights.identityRegistered -= lr * error * features.identityRegistered;
    newWeights.accountAge -= lr * error * features.accountAge;
    newWeights.avgLoanSize -= lr * error * features.avgLoanSize;
    newBias -= lr * error;
  }

  return {
    ...model,
    version: model.version + 1,
    weights: newWeights,
    bias: newBias,
    trainingSamples: model.trainingSamples + outcomes.length,
  };
}
