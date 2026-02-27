#!/bin/bash
# Universe Bank - Full Live Demo Script
# Run from project root: bash demo/demo.sh

set -e

export UNIVERSE_BANK_PASSWORD=demo

# Pre-funded wallet private key (for on-chain demos: identity, payment, deposit)
# Accepts either UNIVERSE_BANK_FUNDED_KEY or UNIVERSE_BANK_PRIVATE_KEY
FUNDED_PRIVATE_KEY="${UNIVERSE_BANK_FUNDED_KEY:-${UNIVERSE_BANK_PRIVATE_KEY:-}}"

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
echo -e "${YELLOW}  ▸ Step 1/9: Create a wallet for an AI Agent${NC}"
echo -e "${DIM}  Generates a new private key, encrypted with AES-256-GCM${NC}"
pause
# Temporarily unset so wallet create generates a fresh key
unset UNIVERSE_BANK_PRIVATE_KEY
type_cmd "ubank wallet create"
run_safe npx tsx src/index.ts wallet create
pause

# Switch to pre-funded wallet for remaining demos
if [ -n "$FUNDED_PRIVATE_KEY" ]; then
  export UNIVERSE_BANK_PRIVATE_KEY="$FUNDED_PRIVATE_KEY"
fi

# ─── Step 2: Wallet Info ──────────────────────────────────
echo -e "${YELLOW}  ▸ Step 2/9: Check wallet balances (Base Sepolia)${NC}"
echo -e "${DIM}  Reads ETH and USDC balances from the blockchain${NC}"
pause
type_cmd "ubank wallet info --network testnet"
run_safe npx tsx src/index.ts wallet info --network testnet
pause

# ─── Step 3: On-Chain Identity ────────────────────────────
echo -e "${YELLOW}  ▸ Step 3/9: Register on-chain identity (ERC-8004)${NC}"
echo -e "${DIM}  Mints an NFT-based identity for the AI Agent${NC}"
pause
if [ -n "$FUNDED_PRIVATE_KEY" ]; then
  type_cmd "ubank identity register --name \"AgentAlpha\" --network testnet"
  run_safe npx tsx src/index.ts identity register --name "AgentAlpha" --network testnet
else
  echo -e "  ${DIM}(Skipping — set UNIVERSE_BANK_FUNDED_KEY to run live)${NC}"
  echo -e "  ${DIM}\$ ubank identity register --name \"AgentAlpha\" --network testnet${NC}"
fi
pause

# ─── Step 4: Payment (x402) ──────────────────────────────
echo -e "${YELLOW}  ▸ Step 4/9: Make an autonomous payment (x402 protocol)${NC}"
echo -e "${DIM}  AI Agent pays for API access via HTTP 402 + USDC${NC}"
pause
if [ -n "$FUNDED_PRIVATE_KEY" ]; then
  type_cmd "ubank pay https://api.example.com/resource"
  run_safe npx tsx src/index.ts pay https://api.example.com/resource
else
  echo -e "  ${DIM}(Skipping — set UNIVERSE_BANK_FUNDED_KEY to run live)${NC}"
  echo -e "  ${DIM}\$ ubank pay https://api.example.com/resource${NC}"
fi
pause

# ─── Step 5: Deposit (Aave V3) ───────────────────────────
echo -e "${YELLOW}  ▸ Step 5/9: Deposit USDC into Aave V3 for yield${NC}"
echo -e "${DIM}  Earn ~4-7% APY on idle USDC via Aave V3 on Base${NC}"
pause
if [ -n "$FUNDED_PRIVATE_KEY" ]; then
  type_cmd "ubank deposit supply 10 --network mainnet"
  run_safe npx tsx src/index.ts deposit supply 10 --network mainnet
  echo ""
  type_cmd "ubank deposit balance --network mainnet"
  run_safe npx tsx src/index.ts deposit balance --network mainnet
else
  echo -e "  ${DIM}(Skipping — set UNIVERSE_BANK_FUNDED_KEY to run live)${NC}"
  echo -e "  ${DIM}\$ ubank deposit supply 10 --network mainnet${NC}"
  echo -e "  ${DIM}\$ ubank deposit balance --network mainnet${NC}"
fi
pause

# ─── Step 6: Credit Score ─────────────────────────────────
echo -e "${YELLOW}  ▸ Step 6/9: Check AI Agent credit score${NC}"
echo -e "${DIM}  Sigmoid-based scoring model (300-850), like FICO for agents${NC}"
pause
type_cmd "ubank credit score"
run_safe npx tsx src/index.ts credit score
pause

# ─── Step 7: Apply for a Loan ─────────────────────────────
echo -e "${YELLOW}  ▸ Step 7/9: Apply for a USDC loan${NC}"
echo -e "${DIM}  Credit model evaluates features, sets interest rate${NC}"
pause
type_cmd "ubank loan apply 50"
run_safe npx tsx src/index.ts loan apply 50
pause

# ─── Step 8: View Credit Model ────────────────────────────
echo -e "${YELLOW}  ▸ Step 8/9: View credit model parameters${NC}"
echo -e "${DIM}  Shows learned weights and model configuration${NC}"
pause
type_cmd "ubank credit model"
run_safe npx tsx src/index.ts credit model
pause

# ─── Step 9: Simulation (The Star) ───────────────────────
echo -e "${YELLOW}  ▸ Step 9/9: Run credit system simulation${NC}"
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
