# Pact

**Your money. Your rules. Remembered.**

Pact is a persistent-memory AI financial agent for Base Sepolia.
It learns your financial rules, goals, trusted relationships, and past decisions, then uses that memory to decide what it is allowed to do with your money.
Every approved action executes onchain from your own vault, bounded by limits that smart contracts enforce - not by a promise.

Live frontend: `frontend` (Next.js).
Contracts deployed to Base Sepolia.
Built for the Sibyl Memory + Base Sepolia hackathon.

## The one rule - the LLM never calls a contract

The dangerous design for a financial agent is letting the model talk to arbitrary contracts.
Pact is built on the opposite rule: **the LLM can see, reason, and decide, but it can never sign or move funds by itself.**

That rule is enforced at three independent layers:

1. **In the LLM boundary.** The agent is instructed to emit *structured intent* - a payment with a recipient, an amount, a token - as JSON, never a raw contract call or calldata.
2. **In the policy engine.** A deterministic `evaluate_payment()` checks every proposed payment against your remembered rules (spending limit, trusted merchants, blocked merchants, vault balance) and returns one of three verdicts.
3. **Onchain.** Even an approved decision only reaches a typed `PactVault.pay()` call. The vault re-validates the per-transaction cap, the daily cap, and the payment ID before a single unit of USDC moves.

There is no path in the codebase where the model constructs calldata and submits it.

## The three verdicts

A payment request never reaches the chain without a policy verdict first.

| Verdict | Meaning |
| --- | --- |
| ✅ **Approve** | Within your rules and vault balance. Pact executes it onchain automatically. |
| 🟡 **Require approval** | Above your autonomous limit or otherwise flagged. Pact holds for you. |
| ❌ **Deny** | Blocked merchant, or insufficient vault balance. Nothing moves. |

That middle verdict is why a memory-augmented agent is safer than a bare one.
Pact remembers your `$100` autonomous limit, and when you ask it to pay `$150` to Acme, it surfaces the remembered rule and asks - it does not guess.
The verdict is a pure function of your memory, the request, and the vault state. It is deterministic and testable.

## What Pact does

Six surfaces, each backed by the same memory → reason → policy loop.

### 1 · AI CFO chat - the hero feature

Paste a financial instruction and Pact reasons over your remembered context before it acts.
The chat returns a structured verdict, quotes the memory it used, and executes approved payments from your vault.

Real flow, from the code:

```
$ curl -X POST localhost:8000/chat?wallet=0x... \
    -H 'content-type: application/json' \
    -d '{"message":"pay 0xAlice 60 USDC"}'

  Do you remember your $100 autonomous limit?
  Acme is within your spending limit and $60 is below your
  $100 autonomous limit. Approved and sent.
```

The verdict that led there came from memory + policy, and the payment was a single typed vault call - the spending key never went near the model.

### 2 · Persistent memory

Backed by the Sibyl Memory SDK, with per-wallet tenant isolation.
Each wallet address maps to its own namespace (`pact_<address>`), so one deployment serves many users without their memories mixing.

Memory is tiered to match the job it does:

- **WARM** - rules, goals, trusted/blocked merchants, policy facts, past decisions. Searchable and used in every decision.
- **HOT** - current session state.
- **COLD** - the payment journal: decisions, approvals, transaction hashes.

Rule updates are upserts keyed on a stable id, so raising `$100 → $150` overwrites the rule instead of stacking duplicates.

### 3 · Goals

Record a savings goal once ("save $2,000 for a MacBook"), and Pact surfaces it in your dashboard and references it in finance chat.
Goals are stored in WARM memory and can be created, listed, and deleted.

### 4 · Payments history

Every decision - approved, held, or denied - is written to the COLD journal.
The payments page filters and displays the decision, amount, reason, and, for approved onchain payments, the transaction hash.

### 5 · Per-user vault

You are not asked to hand your spending keys to a shared contract.
`VaultFactory.createVault()` deploys a `PactVault` that *you* own, with the Pact agent as the only authorized spender.
You deposit USDC, and the agent can move at most your configured per-transaction and daily limits.
Withdrawals are owner-only.

### 6 · Dashboard

Your vault balance, remaining autonomous budget, active goal, and recent activity in one place.
The vault deploy and fund steps are surfaced inline as a banner instead of gating the rest of the app, so you can explore rules, goals, and memory before you ever fund a vault.

## Architecture

Two decisions drive everything else.

- **The decision loop is deterministic.** The LLM produces structured intent; `policy.py` turns it into a verdict; the vault enforces it onchain. Each step is independently testable.
- **Per-user vaults, not a shared pool.** Each user's funds live in a vault they own, so autonomy is bounded per person and per day, not globally.

### The loop

```
User intent → Sibyl memory retrieval → LLM reasoning
    → Policy engine (deterministic verdict) → PactVault (contract-enforced)
    → Memory update (decision + journal)
```

### The security boundary

Three tiers, with the spend capability isolated where the model cannot reach it.

| Tier | Runs | Can it move funds? | Responsibility |
| --- | --- | --- | --- |
| Frontend | user's browser | no | Chat UI, dashboard, vault deploy via your own wallet, goals & memory |
| Backend (FastAPI) | your server | no (signs nothing itself)* | Sibyl retrieval, LLM reasoning, policy verdict, per-user vault lookup |
| Smart contract (PactVault) | Base Sepolia | yes, agent-only, limit-bounded | Deposit, limit-enforced `pay()`, owner withdraw |

The only entity that can spend is the onchain agent address, and only through `PactVault.pay()`, which re-checks limits on-chain.
The agent private key lives in the backend `.env`, never in the frontend, and never in the browser.
The backend holds a fresh spending key only because it must - it is the operational key that turns an approved decision into a signed onchain call.

## Component by component

### Smart contracts (`contracts/` - Solidity, Foundry)

| File | Responsibility |
| --- | --- |
| `PactVault.sol` | Per-user vault. Owner deposits/withdraws; authorized agent pays; `maxPerTransaction` + `dailyLimit` reset on a UTC day boundary; replay protection via `paymentId`. |
| `VaultFactory.sol` | CREATE2 deploy of one `PactVault` per user; tracks `user → vault`; binds the shared agent and default limits. |

### Backend (`backend/` - Python, FastAPI)

| Module | Responsibility |
| --- | --- |
| `agent.py` | The LLM shell. Builds memory context, calls OpenRouter, parses structured intent, wires verdicts to execution. |
| `memory.py` | `PactMemory` over the Sibyl SDK. WARM/HOT/COLD tiers, per-wallet tenants, rule upserts, journal. |
| `policy.py` | `evaluate_payment()` - the deterministic verdict (Approve / Require approval / Deny) as a pure function of rules + request + balance. |
| `executor.py` | Resolves the user's vault from the factory, then signs and broadcasts a typed `pay()` call. |
| `main.py` | FastAPI routes: `/chat`, `/chat/history`, `/memory`, `/rules`, `/goals`, `/payments`, `/vault`, `/vault/status`, `/health`. |

### Frontend (`frontend/` - Next.js)

| Route / module | Responsibility |
| --- | --- |
| `app/page.tsx` | Landing page with animated hero mockup. |
| `app/app/page.tsx` | Dashboard - vault balance, budget, goal, activity, deploy/fund banners. |
| `app/app/chat` | AI CFO chat with persisted history. |
| `app/app/memory` | Rules, goals, and past decisions from memory. |
| `app/app/goals` | Goal create / list / delete. |
| `app/app/payments` | Payment decisions + filters. |
| `components/VaultGate`-era logic | Inline vault deploy (wagmi `writeContract`) and fund prompts. |
| `lib/api.ts` | Typed API client, passes `wallet` to every call. |

## Safety, enforced in code

Every claim here maps to a mechanism, not a promise.

| Claim | How it's enforced |
| --- | --- |
| The LLM can't call arbitrary contracts | Agent emits structured intent; there is no calldata-building path. |
| Approved payments are still bounded | `PactVault.pay()` reverts on `ExceedsMaxPerTransaction`, `DailyLimitExceeded`, `DuplicatePayment`, `InvalidRecipient`, `InvalidAmount`. |
| Your funds aren't a shared pool | Factory CREATE2 deploys a vault per user; you are `owner`, withdrawals are `onlyOwner`. |
| History is auditable | Every decision is stored; every approved payment writes a tx hash to the COLD journal. |
| Nothing moves without a verdict | `agent.py` only executes inside `Decision.APPROVE`, and only after `evaluate_payment()`. |
| Daily autonomy resets cleanly | Vault daily limit resets on the UTC day boundary on first spend of the new day. |
| No replay of a payment | `paymentExecuted[paymentId]` reverts duplicates; the backend hashes wallet + recipient + amount into the payment id. |
| The agent key is server-side only | Stored in backend `.env`; the frontend never receives it. |

The contract itself carries the upgrade path: `setAgent`, `setLimits`, and `transferOwnership` are `onlyOwner`, so you stay in control of the agent's authority.

## How it uses Base Sepolia

Reads. Live vault balances, daily remaining, per-transaction and daily limits through the factory and vault view functions.

Writes / executes. Approved, policy-validated payments through `PactVault.pay()` in USDC.
Every executed payment is verifiable on BaseScan by its transaction hash.

## Engineering decisions

A few calls worth explaining.

**The model produces intent, not calldata.** Forcing the model into a tiny structured JSON shape (recipient, amount, token, merchant) keeps it honest and makes the policy engine the place where judgment happens. A free 120B model can reason about money; it should not be trusted to format a transaction.

**The policy is a pure function.** `evaluate_payment()` takes memory + request + balance and returns a verdict with no side effects. Pure functions are trivially testable and trivially reason-about-able, which is exactly what you want in the layer that holds the line.

**Memory is upserted with stable ids.** Rules and goals use a stable entity id, so user updates edit in place rather than duplicating. Chat history is keyed by timestamp to preserve ordering.

**Per-user vaults as the trust boundary.** Instead of one wallet the agent drains, each user owns a vault with their own limits. An agent error is bounded to one user's configured caps, not the whole product.

**Wallets gate the API.** Every endpoint takes a `wallet` and resolves that user's tenant + vault, so data and spending are scoped per address. The zero-address default is a safe no-op that returns empty state.

## What's real vs pending

The honest table - what is genuinely working, run against real infrastructure, versus what is structural and exercised only by tests.

| Capability | Status |
| --- | --- |
| Decision loop - memory → LLM → policy verdict | Real - runs live, policy is unit-tested |
| VERDICTS (Approve / Require approval / Deny) | Real - pure function, tested in `policy.py` |
| Persistent memory tiers (WARM/HOT/COLD) | Real - Sibyl SDK integration |
| Rule upserts, goals create/list/delete | Real - backed by the SDK |
| Chat history persistence | Real |
| Facades / vault lookup from factory | Real - reads live Base Sepolia |
| Per-user `PactVault` + `VaultFactory` contracts | Real - deployed, 31 Foundry tests passing |
| Deposit / withdraw / agent set / limits set | Real - 16 PactVault tests |
| Factory CREATE2, vault count, getVault | Real - 15 VaultFactory tests |
| Onchain `pay()` execution from the UI flow | Structural code, NOT yet verified end-to-end live with a funded vault |
| Vault deploy from UI (wagmi `writeContract`) | Real code, not yet exercised in a full live run |
| The full spend→receipt loop with a real USDC transfer | Pending live proof - the user vault + funding has not been fully exercised on mainnet |
| CI for the backend Python and frontend TypeScript | Not yet established |

The contracts are deployed and fully unit-tested.
The backend and frontend are real and run.
What is honestly still to be proven is the one continuous live walk: deploy a vault from the UI, fund it, ask the AI CFO to pay, and watch the receipt land on BaseScan.

## Tests

### Smart contracts (Foundry) - 31 passing

| Suite | Tests | Covers |
| --- | --- | --- |
| `PactVault.t.sol` | 16 | deposit, withdraw (owner-only), agent pay, per-tx cap, daily cap reset, replay protection, owners/agent/limits setters |
| `VaultFactory.t.sol` | 15 | CREATE2 deploy, per-user vault, duplicate rejection, getVault, vaultCount, setAgent/setDefaults/transferOwnership |

```
cd contracts
forge build
forge test      # 31 passed
```

The backend policy and executor are Python; there is no pytest suite yet, and the frontend has no test runner yet - both are open contributions (see Roadmap).

## Run it locally

### 1 · Contracts

```bash
cd contracts
forge install
forge build
forge test
```

### 2 · Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # edit with your keys
uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend needs an OpenRouter key (`OPENAI_API_KEY`), the factory address, and the agent private key to execute.
With the agent key unset, the reasoning and verdict flow still runs; only onchain execution is unavailable.

### 3 · Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # edit walletconnect id, api url, factory
npm run dev
```

Open http://localhost:3000, connect a Base Sepolia wallet, deploy your vault from the dashboard banner, fund it with USDC, and ask the AI CFO for a payment.

## The one-flow demo

1. Connect wallet on Base Sepolia.
2. In chat: "I'm saving $2,000 for a MacBook" → goal is remembered.
3. In chat: "you can spend up to $100 without asking" → rule is remembered.
4. In chat: "pay 0xAlice 60 USDC" → auto-approved, executed, receipt returned.
5. In chat: "pay 0xAlice 150 USDC" → held, because Pact remembers the $100 limit.
6. Open Payments → the decision, amount, and tx hash are journaled.

## Configuration

Backend `backend/.env`:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | OpenRouter / LLM key |
| `OPENAI_BASE_URL` | Default `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | Default `nvidia/nemotron-3-super-120b-a12b:free` |
| `BASE_SEPOLIA_RPC` | Default `https://sepolia.base.org` |
| `VAULT_FACTORY_ADDRESS` | Deployed VaultFactory (Base Sepolia) |
| `AGENT_PRIVATE_KEY` | The onchain agent key (server-only, never shipped to the browser) |
| `USDC_CONTRACT_ADDRESS` | Base Sepolia USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| `SIBYL_DB_PATH` | Local Sibyl memory db |

Frontend `frontend/.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project id |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | Base Sepolia RPC |
| `NEXT_PUBLIC_VAULT_FACTORY_ADDRESS` | Factory used by the deploy button |

Keep the backend `.env` and the `AGENT_PRIVATE_KEY` out of git.
The deploy script (`contracts/deploy.sh`) generates and persists the agent keypair, then writes the factory address into both `.env` files.

```bash
cd contracts
./deploy.sh <deployer-private-key>   # needs Sepolia ETH
```

## Project layout

```
contracts/     Solidity, Foundry - PactVault + VaultFactory (+ deploy.sh)
  src/         PactVault.sol · VaultFactory.sol
  test/        PactVault.t.sol (16) · VaultFactory.t.sol (15)
  script/      DeployVaultFactory.s.sol
backend/       FastAPI + Sibyl SDK
  main.py      routes
  agent.py     LLM reasoning + intent handling
  policy.py    deterministic verdict
  memory.py    WARM/HOT/COLD memory over Sibyl
  executor.py  per-user vault payment execution
frontend/      Next.js (App Router), wagmi, RainbowKit
  src/app/     landing · dashboard · chat · memory · goals · payments
  src/components/  sidebar · toast · skeleton
  src/lib/     api.ts · abis.ts · wagmi.ts
```

## Tech stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS v4, Framer Motion, wagmi, viem, RainbowKit.
- **Backend**: Python, FastAPI, OpenRouter (free models), web3.py, Sibyl Memory SDK.
- **Smart contracts**: Solidity, Foundry, OpenZeppelin (IERC20 / SafeERC20).
- **Network**: Base Sepolia (chain 84532), USDC.

## Roadmap

- Prove the full live loop end-to-end: deploy vault from UI → fund → AI CFO pays → receipt on BaseScan.
- Add a pytest suite for `policy.py` and `memory.py`, and a Vitest suite for `lib/api.ts` and the verdict mirror.
- Approval UX in the frontend for `REQUIRE_APPROVAL` decisions (today the verdict is surfaced, not confirmed in-UI).
- Withdraw and agent / limits management UI (contract methods exist, the UI shows them for the owner only through the vault).
- Sendgrid / Discord alert when a payment executes.
- A hosted live deployment of the backend.

## Disclaimer

Pact is an educational, demonstration project - not financial advice and not a custodial service.
You always remain the owner of your vault; the agent's authority is bounded by your configured limits and revocable by you (`setAgent`, `withdraw`).
Testnet funds only today - do not point this at a real-money vault without a full audit and hardening.

## License

MIT - see LICENSE.
