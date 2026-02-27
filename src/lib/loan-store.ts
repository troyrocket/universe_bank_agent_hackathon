import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { getLoansPath } from './config.js';

export interface Loan {
  id: string;
  borrower: string;
  amount: number;
  interestRate: number;
  creditScoreAtOrigination: number;
  status: 'active' | 'repaid' | 'defaulted';
  disbursedAt: number;
  dueAt: number;
  repaidAmount: number;
  repaidAt?: number;
  defaultedAt?: number;
}

export interface LoanStore {
  loans: Loan[];
  totalDisbursed: number;
  totalRepaid: number;
  totalDefaulted: number;
}

export function loadLoanStore(): LoanStore {
  const path = getLoansPath();
  if (!existsSync(path)) {
    return { loans: [], totalDisbursed: 0, totalRepaid: 0, totalDefaulted: 0 };
  }
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function saveLoanStore(store: LoanStore): void {
  writeFileSync(getLoansPath(), JSON.stringify(store, null, 2));
}

export function createLoan(
  borrower: string,
  amount: number,
  interestRate: number,
  creditScore: number,
  epoch?: number,
): Loan {
  const now = epoch ?? Date.now();
  return {
    id: randomUUID().slice(0, 8),
    borrower,
    amount,
    interestRate,
    creditScoreAtOrigination: creditScore,
    status: 'active',
    disbursedAt: now,
    dueAt: epoch != null ? now + 3 : now + 30 * 24 * 60 * 60 * 1000,
    repaidAmount: 0,
  };
}

export function addLoan(store: LoanStore, loan: Loan): LoanStore {
  return {
    ...store,
    loans: [...store.loans, loan],
    totalDisbursed: store.totalDisbursed + loan.amount,
  };
}

export function getActiveLoans(store: LoanStore): Loan[] {
  return store.loans.filter(l => l.status === 'active');
}

export function getLoanSummary(store: LoanStore) {
  const active = store.loans.filter(l => l.status === 'active');
  const repaid = store.loans.filter(l => l.status === 'repaid');
  const defaulted = store.loans.filter(l => l.status === 'defaulted');

  return {
    total: store.loans.length,
    active: active.length,
    repaid: repaid.length,
    defaulted: defaulted.length,
    totalDisbursed: store.totalDisbursed,
    totalRepaid: store.totalRepaid,
    totalDefaulted: store.totalDefaulted,
    activeBalance: active.reduce((s, l) => s + l.amount - l.repaidAmount, 0),
  };
}
