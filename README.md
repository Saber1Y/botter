# Pact

**Your money. Your rules. Remembered.**

Pact is a persistent-memory financial agent that learns a user's financial rules, goals, preferences, trusted relationships, and previous decisions, then uses that memory to decide what financial actions it is allowed to take.

## Architecture

```
User Intent -> Sibyl Memory -> Policy Engine -> Base Sepolia Payment -> Memory Update
```

## Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS, wagmi, viem, RainbowKit
- **Backend**: Python, FastAPI, OpenAI, web3.py
- **Smart Contract**: Solidity, Foundry, OpenZeppelin
- **Memory**: Sibyl (persistent agent memory)
- **Network**: Base Sepolia

## Quick Start

### 1. Smart Contract

```bash
cd contracts
forge install
forge build
forge test
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your keys
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local
npm run dev
```

## Demo Flow

1. Connect wallet on Base Sepolia
2. Tell Pact: "I'm saving $2,000 for a MacBook"
3. Tell Pact: "You can spend up to $100 without asking"
4. Show the Memory page
5. Ask Pact: "Pay Acme $60" - auto-approved
6. Ask Pact: "Pay Acme $150" - requires approval (remembers the $100 limit)
7. Approve the payment
8. View the Base Sepolia transaction

## Environment Variables

### Backend

- `OPENAI_API_KEY` - OpenAI API key
- `BASE_SEPOLIA_RPC` - Base Sepolia RPC URL
- `VAULT_CONTRACT_ADDRESS` - Deployed PactVault address
- `AGENT_PRIVATE_KEY` - Agent wallet private key
- `USDC_CONTRACT_ADDRESS` - USDC contract on Base Sepolia
- `SIBYL_API_URL` - Sibyl Memory API URL

### Frontend

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC` - Base Sepolia RPC URL

## License

MIT
