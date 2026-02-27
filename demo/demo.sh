#!/bin/bash
# Universe Bank - Full Live Demo Script
# Run from project root: bash demo/demo.sh

set -e

export UNIVERSE_BANK_PASSWORD=demo

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

pause() {
  echo ""
  echo -e "${DIM}  Press Enter to continue...${NC}"
  read -r
  echo ""
}

type_cmd() {
  echo -e "${GREEN}  \$ $1${NC}"
  sleep 0.3
}

run_safe() {
  # Run command, capture exit code, don't fail the script
  "$@" 2>&1 || true
}

# ─── Header ───────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  ${BOLD}UNIVERSE BANK${NC}${CYAN} — Live Demo${NC}"
echo -e "${CYAN}  The JP Morgan for AI Agents on Base Chain${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ─── Step 1: Create Wallet ────────────────────────────────
echo -e "${YELLOW}  ▸ Step 1/7: Create a wallet for an AI Agent${NC}"
echo -e "${DIM}  Generates a new private key, encrypted with AES-256-GCM${NC}"
pause
type_cmd "ubank wallet create"
run_safe npx tsx src/index.ts wallet create
pause

# ─── Step 2: Wallet Info ──────────────────────────────────
echo -e "${YELLOW}  ▸ Step 2/7: Check wallet balances (Base Sepolia)${NC}"
echo -e "${DIM}  Reads ETH and USDC balances from the blockchain${NC}"
pause
type_cmd "ubank wallet info --network testnet"
run_safe npx tsx src/index.ts wallet info --network testnet
pause

# ─── Step 3: On-Chain Features (Overview) ─────────────────
echo -e "${YELLOW}  ▸ Step 3/7: On-Chain Features (requires testnet funds)${NC}"
echo ""
echo -e "  Universe Bank supports full on-chain operations for funded wallets:"
echo ""
echo -e "  ${GREEN}Identity${NC}  — Register on-chain identity via ERC-8004 (NFT)"
echo -e "             ${DIM}\$ ubank identity register --name \"AgentAlpha\"${NC}"
echo ""
echo -e "  ${GREEN}Payment${NC}   — Autonomous HTTP 402 payments via x402 protocol"
echo -e "             ${DIM}\$ ubank pay https://api.example.com/resource${NC}"
echo ""
echo -e "  ${GREEN}Yield${NC}     — Deposit USDC into Aave V3 for ~4-7% APY"
echo -e "             ${DIM}\$ ubank deposit supply 100 --network mainnet${NC}"
echo ""
echo -e "  ${DIM}(Skipping live execution — wallet needs ETH + USDC to transact)${NC}"
pause

# ─── Step 4: Credit Score ─────────────────────────────────
echo -e "${YELLOW}  ▸ Step 4/7: Check AI Agent credit score${NC}"
echo -e "${DIM}  Sigmoid-based scoring model (300-850), like FICO for agents${NC}"
pause
type_cmd "ubank credit score"
run_safe npx tsx src/index.ts credit score
pause

# ─── Step 5: Apply for a Loan ─────────────────────────────
echo -e "${YELLOW}  ▸ Step 5/7: Apply for a USDC loan${NC}"
echo -e "${DIM}  Credit model evaluates features, sets interest rate${NC}"
pause
type_cmd "ubank loan apply 50"
run_safe npx tsx src/index.ts loan apply 50
pause

# ─── Step 6: View Credit Model ────────────────────────────
echo -e "${YELLOW}  ▸ Step 6/7: View credit model parameters${NC}"
echo -e "${DIM}  Shows learned weights and model configuration${NC}"
pause
type_cmd "ubank credit model"
run_safe npx tsx src/index.ts credit model
pause

# ─── Step 7: Simulation (The Star) ───────────────────────
echo -e "${YELLOW}  ▸ Step 7/7: Run credit system simulation${NC}"
echo -e "${DIM}  100 AI agents × 24 epochs — watch the model learn!${NC}"
echo -e "${DIM}  The credit model starts naive and self-improves via online SGD${NC}"
pause
type_cmd "ubank simulate run --agents 100 --epochs 24 --seed 42"
npx tsx src/index.ts simulate run --agents 100 --epochs 24 --seed 42
echo ""

# ─── Summary ──────────────────────────────────────────────
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  ${BOLD}Demo Complete!${NC}"
echo ""
echo -e "  ${GREEN}Wallet${NC}       — AI Agent creates its own wallet (AES-256-GCM)"
echo -e "  ${GREEN}Identity${NC}     — On-chain identity via ERC-8004 (NFT)"
echo -e "  ${GREEN}Payment${NC}      — Autonomous payments via x402 protocol"
echo -e "  ${GREEN}Yield${NC}        — Earn yield by depositing into Aave V3"
echo -e "  ${GREEN}Credit${NC}       — Self-improving credit scoring (logistic regression)"
echo -e "  ${GREEN}Lending${NC}      — Loan application, approval, repayment lifecycle"
echo -e "  ${GREEN}Simulation${NC}   — 100 agents, default rate drops ~35% → ~15%"
echo ""
echo -e "  ${BOLD}Core Innovation:${NC} Credit model self-improves via online SGD"
echo -e "  ${DIM}w -= lr × (predicted - actual) × feature${NC}"
echo ""
echo -e "  ${DIM}Universe Bank: The JP Morgan for AI Agents${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
