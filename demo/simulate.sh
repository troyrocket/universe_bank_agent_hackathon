#!/bin/bash
# Universe Bank - Simulation Demo (Quick Run)
# Shows the self-improving credit model in action
# Run: bash demo/simulate.sh

CYAN='\033[0;36m'
GREEN='\033[0;32m'
DIM='\033[2m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  UNIVERSE BANK - Self-Improving Credit Model Demo${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${DIM}  Simulating 100 AI agents borrowing over 24 epochs.${NC}"
echo -e "${DIM}  Watch the credit model learn to reduce default rates.${NC}"
echo ""
echo -e "${GREEN}  \$ ubank simulate run --agents 100 --epochs 24 --seed 42${NC}"
echo ""

npx tsx src/index.ts simulate run --agents 100 --epochs 24 --seed 42
