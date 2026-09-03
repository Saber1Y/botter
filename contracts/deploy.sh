#!/bin/bash
# Deploy VaultFactory to Base Sepolia
# Usage: ./deploy.sh <your-wallet-private-key>

set -e

if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh <your-wallet-private-key>"
  echo ""
  echo "This wallet deploys the VaultFactory contract."
  echo "It needs Sepolia ETH (get from https://sepoliafaucet.com)"
  exit 1
fi

DEPLOYER_KEY="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

PYTHON="/Users/mac/.local/share/uv/python/cpython-3.13.12-macos-aarch64-none/bin/python3"

# Generate agent keypair if not exists
AGENT_KEY_FILE="$BACKEND_DIR/.agent_key"
if [ ! -f "$AGENT_KEY_FILE" ]; then
  echo "Generating agent keypair..."
  $PYTHON -c "
import secrets, binascii
key = '0x' + binascii.hexlify(secrets.token_bytes(32)).decode()
print(key)
" > "$AGENT_KEY_FILE"
  chmod 600 "$AGENT_KEY_FILE"
  echo "Agent key saved to $AGENT_KEY_FILE"
fi

AGENT_KEY=$(cat "$AGENT_KEY_FILE" | tr -d '\n')

# Derive agent address from private key
AGENT_ADDRESS=$($PYTHON -c "
from eth_account import Account
acct = Account.from_key('$AGENT_KEY')
print(acct.address)
")

echo ""
echo "=== VaultFactory Deployment ==="
echo "Deployer: $($PYTHON -c "from eth_account import Account; print(Account.from_key('$DEPLOYER_KEY').address)")"
echo "Agent:    $AGENT_ADDRESS"
echo "USDC:     0x036CbD53842c5426634e7929541eC2318f3dCF7e (Base Sepolia)"
echo "Limits:   \$500/tx, \$1000/day (default per vault)"
echo ""

# Deploy
cd "$SCRIPT_DIR"
export AGENT_ADDRESS="$AGENT_ADDRESS"
export PRIVATE_KEY="$DEPLOYER_KEY"
forge script script/DeployVaultFactory.s.sol:DeployVaultFactory \
  --rpc-url https://sepolia.base.org \
  --private-key "$DEPLOYER_KEY" \
  --broadcast \
  --verify \
  --etherscan-api-key "${ETHERSCAN_API_KEY:-}" \
  2>&1 | tee /tmp/pact-deploy.log

# Extract contract address
FACTORY_ADDRESS=$(grep 'VaultFactory deployed at:' /tmp/pact-deploy.log | sed 's/.*0x/0x/' | head -1)

if [ -z "$FACTORY_ADDRESS" ]; then
  echo ""
  echo "Deployment may have succeeded but couldn't parse address."
  echo "Check the output above for the contract address."
  exit 1
fi

echo ""
echo "=== Deployment Complete ==="
echo "Factory: $FACTORY_ADDRESS"
echo ""

# Update backend .env
sed -i.bak "s|VAULT_FACTORY_ADDRESS=.*|VAULT_FACTORY_ADDRESS=$FACTORY_ADDRESS|" "$BACKEND_DIR/.env"
sed -i.bak "s|AGENT_PRIVATE_KEY=.*|AGENT_PRIVATE_KEY=$AGENT_KEY|" "$BACKEND_DIR/.env"

# Also set frontend env
FRONTEND_ENV="$SCRIPT_DIR/../frontend/.env.local"
if [ -f "$FRONTEND_ENV" ]; then
  if grep -q "NEXT_PUBLIC_VAULT_FACTORY_ADDRESS" "$FRONTEND_ENV"; then
    sed -i.bak "s|NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=.*|NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=$FACTORY_ADDRESS|" "$FRONTEND_ENV"
  else
    echo "NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=$FACTORY_ADDRESS" >> "$FRONTEND_ENV"
  fi
fi

echo "Updated backend/.env with:"
echo "  VAULT_FACTORY_ADDRESS=$FACTORY_ADDRESS"
echo "  AGENT_PRIVATE_KEY=<set>"
echo ""
echo "Updated frontend/.env.local with:"
echo "  NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=$FACTORY_ADDRESS"
echo ""
echo "Next steps:"
echo "1. Restart the backend: kill \$(lsof -ti :8000) && cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 &"
echo "2. Users deploy their own vault via the UI (calls factory.createVault())"
echo "3. Users deposit USDC into their vault"
echo "4. AI CFO executes payments from each user's vault"
