import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { getCreditModelPath } from './config.js';

export interface CreditWeights {
  transactionCount: number;
  repaymentRate: number;
  aaveDeposits: number;
  identityRegistered: number;
  accountAge: number;
  avgLoanSize: number;
}

export interface CreditModelParams {
  version: number;
  weights: CreditWeights;
  bias: number;
  threshold: number;
  maxLoanMultiplier: number;
  baseInterestRate: number;
  riskPremiumFactor: number;
  learningRate: number;
  trainingSamples: number;
}

export const DEFAULT_MODEL: CreditModelParams = {
  version: 0,
  weights: {
    transactionCount: 0.0,
    repaymentRate: 0.0,
    aaveDeposits: 0.0,
    identityRegistered: 0.0,
    accountAge: 0.0,
    avgLoanSize: 0.0,
  },
  bias: 1.5,
  threshold: 0.25,
  maxLoanMultiplier: 500,
  baseInterestRate: 0.10,
  riskPremiumFactor: 0.08,
  learningRate: 0.12,
  trainingSamples: 0,
};

export function loadModel(): CreditModelParams {
  const path = getCreditModelPath();
  if (!existsSync(path)) return { ...DEFAULT_MODEL, weights: { ...DEFAULT_MODEL.weights } };
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function saveModel(model: CreditModelParams): void {
  writeFileSync(getCreditModelPath(), JSON.stringify(model, null, 2));
}
