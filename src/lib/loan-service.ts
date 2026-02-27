import { loadModel, saveModel } from './credit-model.js';
import {
  extractFeatures,
  calculateCreditScore,
  evaluateLoanApplication,
  updateModel,
  CreditFeatures,
} from './credit-engine.js';
import {
  loadLoanStore,
  saveLoanStore,
  createLoan,
  addLoan,
  getActiveLoans,
  Loan,
} from './loan-store.js';
import { readConfig } from './config.js';

export interface LoanApplicationResult {
  approved: boolean;
  score: number;
  maxAmount: number;
  interestRate: number;
  reason: string;
  loan?: Loan;
}

export async function applyForLoan(
  borrowerAddress: string,
  amount: number,
): Promise<LoanApplicationResult> {
  const model = loadModel();
  const store = loadLoanStore();
  const config = readConfig();

  const myLoans = store.loans.filter(l => l.borrower === borrowerAddress);
  const repaymentHistory = myLoans
    .filter(l => l.status !== 'active')
    .map(l => (l.status === 'repaid' ? 1 : 0));

  const features = extractFeatures({
    transactionCount: myLoans.length * 2 + 5,
    repaymentHistory,
    aaveDeposits: 0,
    identityRegistered: !!config.agentId,
    accountAge: 1,
    totalBorrowed: myLoans.reduce((s, l) => s + l.amount, 0),
    loanCount: myLoans.length,
  });

  const score = calculateCreditScore(features, model);
  const decision = evaluateLoanApplication(score, amount, model);

  if (!decision.approved) {
    return { ...decision };
  }

  const loan = createLoan(borrowerAddress, amount, decision.interestRate, score);
  const updatedStore = addLoan(store, loan);
  saveLoanStore(updatedStore);

  return { ...decision, loan };
}

export function repayLoan(borrowerAddress: string, amount: number): {
  loan: Loan;
  amountApplied: number;
  remainingBalance: number;
  fullyRepaid: boolean;
} {
  const store = loadLoanStore();
  const active = getActiveLoans(store).filter(l => l.borrower === borrowerAddress);

  if (active.length === 0) {
    throw new Error('No active loans found');
  }

  // Apply to oldest loan first
  const loan = active[0];
  const totalOwed = loan.amount * (1 + loan.interestRate) - loan.repaidAmount;
  const amountApplied = Math.min(amount, totalOwed);
  loan.repaidAmount += amountApplied;

  const fullyRepaid = loan.repaidAmount >= loan.amount * (1 + loan.interestRate) - 0.01;
  if (fullyRepaid) {
    loan.status = 'repaid';
    loan.repaidAt = Date.now();
    store.totalRepaid += loan.repaidAmount;

    // Self-improve: update model on successful repayment
    const model = loadModel();
    const config = readConfig();
    const myLoans = store.loans.filter(l => l.borrower === borrowerAddress);
    const repaymentHistory = myLoans
      .filter(l => l.status !== 'active')
      .map(l => (l.status === 'repaid' ? 1 : 0));
    const features = extractFeatures({
      transactionCount: myLoans.length * 2 + 5,
      repaymentHistory,
      aaveDeposits: 0,
      identityRegistered: !!config.agentId,
      accountAge: 1,
      totalBorrowed: myLoans.reduce((s, l) => s + l.amount, 0),
      loanCount: myLoans.length,
    });
    const updated = updateModel(model, [{ features, repaid: true }]);
    saveModel(updated);
  }

  saveLoanStore(store);

  return {
    loan,
    amountApplied,
    remainingBalance: fullyRepaid ? 0 : totalOwed - amountApplied,
    fullyRepaid,
  };
}
