#!/bin/bash
# Universe Bank - Live Demo Script
# Run: bash demo.sh

export UNIVERSE_BANK_PASSWORD=demo

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
DIM='\033[2m'
NC='\033[0m'

pause() {
  echo ""
  echo -e "${DIM}  Press Enter to continue...${NC}"
  read -r
  echo ""
}

type_cmd() {
  echo -e "${GREEN}  \$ $1${NC}"
  sleep 0.5
}

# Show logo
npx tsx src/index.ts --help 2>&1 | head -11
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  UNIVERSE BANK - Live Demo${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Step 1: Wallet
echo ""
echo -e "${YELLOW}  Step 1: Create a wallet for an AI Agent${NC}"
pause
type_cmd "ubank wallet create"
npx tsx src/index.ts wallet create
pause

# Step 2: Check balance
echo -e "${YELLOW}  Step 2: Check wallet balances on Base Sepolia${NC}"
pause
type_cmd "ubank wallet info --network testnet"
npx tsx src/index.ts wallet info --network testnet
pause

# Step 3: Register identity
echo -e "${YELLOW}  Step 3: Register on-chain identity (ERC-8004)${NC}"
echo -e "${DIM}  Minting an identity NFT on the ERC-8004 Identity Registry...${NC}"
pause
type_cmd 'ubank identity register --name "AgentAlpha" --description "Autonomous yield-farming agent"'
npx tsx src/index.ts identity register --name "AgentAlpha" --description "Autonomous yield-farming agent" --network testnet
pause

# Step 4: Verify identity
echo -e "${YELLOW}  Step 4: Verify on-chain identity${NC}"
pause
type_cmd "ubank identity info --network testnet"
npx tsx src/index.ts identity info --network testnet
pause

# Step 5: x402 payment
echo -e "${YELLOW}  Step 5: Make an x402 payment${NC}"
echo -e "${DIM}  The agent pays for API access automatically via HTTP 402...${NC}"
pause
type_cmd "ubank pay https://example.com"
npx tsx src/index.ts pay https://example.com
pause

# Step 6: Deposit
echo -e "${YELLOW}  Step 6: Deposit USDC into Aave V3 for yield${NC}"
pause
type_cmd "ubank deposit balance --network mainnet"
npx tsx src/index.ts deposit balance --network mainnet
pause

# Summary
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Demo Complete!${NC}"
echo ""
echo -e "  ${GREEN}Wallet${NC}     - AI Agent creates its own wallet"
echo -e "  ${GREEN}Identity${NC}   - On-chain identity via ERC-8004 (NFT)"
echo -e "  ${GREEN}Payment${NC}    - Autonomous payments via x402 protocol"
echo -e "  ${GREEN}Yield${NC}      - Earn yield by depositing into Aave V3"
echo ""
echo -e "  ${DIM}Universe Bank: The JP Morgan for AI Agents${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
