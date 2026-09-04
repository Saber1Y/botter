# Pact

**Your money. Your rules. Remembered.**

Every AI financial agent asks you to hand over control, then hopes the model behaves.
Pact asks the opposite question: what if the agent remembered your rules, your goals, your past decisions, and then let a deterministic policy engine and a smart contract - not a nervous language model - decide what it is actually allowed to spend?
On Base Sepolia, in USDC, with each user's money isolated in a vault they own and the agent's spending bounded by limits the contract enforces on every single call.
No model ever touches your spending key. Pact reasons in your memory, and only signs the exact, policy-verified payments your vault authorizes.

Live frontend: `http://localhost:3000` (Next.js) · Contracts on Base Sepolia.

[The one rule ↗](#the-one-rule--never-a-spending-key) · [Architecture ↗](#architecture) · [Component by component ↗](#component-by-component) · [What's real vs pending ↗](#whats-real-vs-pending--the-honesty-table) · [Run it locally ↗](#run-it-locally)

Built for the Sibyl Memory × Base Sepolia Hackathon · Payments + agent track · MIT licensed.
An educational tool, not financial advice, and not a custodial service.

## Table of contents

- [See it in one command](#see-it-in-one-command)
- [The one rule — never a spending key](#the-one-rule--never-a-spending-key)
- [What Pact does](#what-pact-does)
  - [AI CFO chat — the hero feature](#ai-cfo-chat--the-hero-feature)
  - [Persistent memory](#persistent-memory)
  - [Goals](#goals)
  - [Payments history](#payments-history)
  - [Per-user vault](#per-user-vault)
  - [Dashboard](#dashboard)
- [Architecture](#architecture)
  - [Process model & the security boundary](#process-model--the-security-boundary)
- [Component by component](#component-by-component)
- [Safety, enforced in code](#safety-enforced-in-code)
- [How it uses Base Sepolia](#how-it-uses-base-sepolia)
- [Engineering decisions & the hard problems](#engineering-decisions--the-hard-problems)
- [What's real vs pending — the honesty table](#whats-real-vs-pending--the-honesty-table)
- [Tests](#tests)
- [Run it locally](#run-it-locally)
- [Configuration](#configuration)
- [Deploy](#deploy)
- [Project layout](#project-layout)
- [Tech stack · Credits · Roadmap](#tech-stack--credits--roadmap)
- [Disclaimer & license](#disclaimer--license)

## See it in one command

The shortest way to feel what Pact is: start the backend and the frontend, connect a Base Sepolia wallet, and ask the AI CFO for a payment.

```bash
# in one terminal — backend
cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
cp .env.example .env          # add OPENAI_API_KEY
uvicorn main:app --host 0.0.0.0 --port 8000

# in another terminal — frontend
cd frontend && npm install && npm run dev
```

Open http://localhost:3000, connect with RainbowKit, and tell Pact:
"I'm saving $2,000 for a MacBook" — then "you can spend up to $100 without asking" — then "pay 0xAlice 60 USDC".
Watch the payment get remembered, checked against your rules, approved, and executed from your vault.

## The one rule — never a spending key

The dangerous design for a financial agent is letting the model hold your keys and call arbitrary contracts.
Pact is built on the opposite rule: **the agent can see, reason, and decide, but it can never sign or move funds by itself, and it never touches your spending key.**

That rule is enforced at three independent layers:

1. **In the LLM boundary.** The agent is instructed to emit *structured intent* — a payment with a recipient, an amount, and a token — as JSON, never a raw contract call or calldata. There is no calldata-building code path in the repository.
2. **In the policy engine.** A deterministic `evaluate_payment()` checks every proposed payment against your remembered rules (spending limit, trusted merchants, blocked merchants) and your vault balance, and returns one of three verdicts.
3. **Onchain.** Even an approved decision only reaches a typed `PactVault.pay()` call. The vault re-validates the per-transaction cap, the daily cap, and the payment ID before a single unit of USDC moves. Your own vault stays yours — you own it, only you can withdraw, and the agent's authority is bounded by the limits you configure.

There is no path in the codebase where the model signs, holds a key, or constructs and submits calldata.

## What Pact does

Six surfaces, each backed by the same memory → reason → policy loop.

### AI CFO chat — the hero feature

Paste a financial instruction and Pact reasons over your remembered context before it acts.
The chat returns a structured verdict, quotes the memory it used, and executes approved payments from your vault — all from a natural-language instruction.

Real flow, from the code:

```
PAYMENT intent: recipient 0xAlice, amount 60, merchant Acme
  ↓ evaluate_payment() against remembered rule (spending_limit=$100) and vault balance
  ↓ Decision.APPROVE
  ↓ PactVault.pay() — a single typed, limit-checked onchain call
  ↓ COLD journal records decision + tx hash
```

The verdict is a pure function of memory + request + vault state. It is deterministic and testable.

### Persistent memory

Backed by the Sibyl Memory SDK, with per-wallet tenant isolation.
Each wallet address maps to its own namespace (`pact_<address>`), so one deployment serves many users without their memories mixing.

Memory is tiered to match the job it does:

- **WARM** — rules, goals, trusted/blocked merchants, policy facts, past decisions. Searchable and used in every decision.
- **HOT** — current session state.
- **COLD** — the payment journal: decisions, approvals, transaction hashes.

Rule and goal updates are upserts keyed on a stable id, so raising `$100 → $150` overwrites the rule instead of stacking duplicates.

### Goals

Record a savings goal once ("save $2,000 for a MacBook"), and Pact surfaces it in your dashboard and references it in finance chat.
Goals are stored in WARM memory and can be created, listed, and deleted.

### Payments history

Every decision — approved, held, or denied — is written to the COLD journal.
The payments page filters and displays the decision, amount, reason, and, for approved onchain payments, the transaction hash.

### Per-user vault

You are not asked to hand a spending key to a shared contract.
`VaultFactory.createVault()` deploys a `PactVault` that *you* own, with the Pact agent as the only authorized spender.
You deposit USDC, and the agent can move at most your configured per-transaction and daily limits.
Withdrawals are owner-only, and you can revoke or re-scope the agent's authority (`setAgent`, `setLimits`) at any time.

### Dashboard

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

### Process model & the security boundary

Three tiers, with the spend capability isolated where the model cannot reach it.

| Tier | Runs | Can it move funds? | Responsibility |
| --- | --- | --- | --- |
| Frontend | user's browser | no | Chat UI, dashboard, vault deploy via your own wallet, goals & memory |
| Backend (FastAPI) | your server | signs approved calls only | Sibyl retrieval, LLM reasoning, policy verdict, per-user vault lookup |
| Smart contract (PactVault) | Base Sepolia | yes, agent-only, limit-bounded | Deposit, limit-enforced `pay()`, owner withdraw |

The only entity that can spend is the onchain agent address, and only through `PactVault.pay()`, which re-checks limits on-chain.
The agent private key lives in the backend `.env`, never in the frontend, and never in the browser.
It is the operational key that turns an already-policy-approved decision into a signed onchain call — not a key the model decides how to spend.

## Component by component

### Smart contracts (`contracts/` — Solidity, Foundry)

| File | Responsibility |
| --- | --- |
| `PactVault.sol` | Per-user vault. Owner deposits/withdraws; authorized agent pays; `maxPerTransaction` + `dailyLimit` reset on a UTC day boundary; replay protection via `paymentId`. |
| `VaultFactory.sol` | CREATE2 deploy of one `PactVault` per user; tracks `user → vault`; binds the shared agent and default limits. |

### Backend (`backend/` — Python, FastAPI)

| Module | Responsibility |
| --- | --- |
| `agent.py` | The LLM shell. Builds memory context, calls OpenRouter, parses structured intent, wires verdicts to execution. |
| `memory.py` | `PactMemory` over the Sibyl SDK. WARM/HOT/COLD tiers, per-wallet tenants, rule upserts, journal. |
| `policy.py` | `evaluate_payment()` — the deterministic verdict (Approve / Require approval / Deny) as a pure function of rules + request + balance. |
| `executor.py` | Resolves the user's vault from the factory, then signs and broadcasts a typed `pay()` call. |
| `main.py` | FastAPI routes: `/chat`, `/chat/history`, `/memory`, `/rules`, `/goals`, `/payments`, `/vault`, `/vault/status`, `/health`. |

### Frontend (`frontend/` — Next.js)

| Route / module | Responsibility |
| --- | --- |
| `app/page.tsx` | Landing page with animated hero mockup. |
| `app/app/page.tsx` | Dashboard — vault balance, budget, goal, activity, deploy/fund banners. |
| `app/app/chat` | AI CFO chat with persisted history. |
| `app/app/memory` | Rules, goals, and past decisions from memory. |
| `app/app/goals` | Goal create / list / delete. |
| `app/app/payments` | Payment decisions + filters. |
| `lib/api.ts` | Typed API client, passes `wallet` to every call. |
| `lib/abis.ts` | VaultFactory ABI for the deploy button. |

## Safety, enforced in code

Every claim here maps to a mechanism, not a promise.

| Claim | How it's enforced |
| --- | --- |
| The LLM can't call arbitrary contracts | Agent emits structured intent via `response_format=json_object`; there is no calldata-building path. |
| Approved payments are still bounded | `PactVault.pay()` reverts on `ExceedsMaxPerTransaction`, `DailyLimitExceeded`, `DuplicatePayment`, `InvalidRecipient`, `InvalidAmount`. |
| Your funds aren't a shared pool | Factory CREATE2 deploys a vault per user; you are `owner`, withdrawals are `onlyOwner`. |
| History is auditable | Every decision is stored; every approved payment writes a tx hash to the COLD journal. |
| Nothing moves without a verdict | `agent.py` only executes inside `Decision.APPROVE`, and only after `evaluate_payment()`. |
| Daily autonomy resets cleanly | Vault daily limit resets on the UTC day boundary on first spend of the new day. |
| No replay of a payment | `paymentExecuted[paymentId]` reverts duplicates; the backend hashes wallet + recipient + amount into the payment id. |
| The agent key is server-side only | Stored in backend `.env`; the frontend never receives it. |
| You stay in control | `setAgent`, `setLimits`, `transferOwnership` are `onlyOwner`; you can revoke the agent. |

## How it uses Base Sepolia

Reads. Live vault balances, daily remaining, and per-transaction and daily limits through the factory and vault view functions.

Writes / executes. Approved, policy-validated payments through `PactVault.pay()` in USDC (Base Sepolia `0x036CbD53842c5426634e7929541eC2318f3dCF7e`).
Every executed payment is verifiable on BaseScan by its transaction hash.

A note on limits vs. spending: `VaultFactory` binds a default `$500/tx` and `$1000/day` per vault; the AI CFO surfaces each user's remembered autonomous limit (from memory) on top of it.
The contract's limits are the hard floor that the model can never exceed, and the remembered spending limit is the autonomous floor the agent applies during reasoning.

## Engineering decisions & the hard problems

A few calls worth explaining.

**The model produces intent, not calldata.** Forcing the model into a tiny structured JSON shape (intent, recipient, amount, token, merchant) keeps it honest and makes the policy engine the place where judgment happens. A free 120B model can reason about money; it should not be trusted to format a transaction.

**The policy is a pure function.** `evaluate_payment()` takes memory + request + balance and returns a verdict with no side effects. Pure functions are trivially testable and trivially reason-about-able — exactly what you want in the layer that holds the line.

**Memory is upserted with stable ids.** Rules and goals use a stable entity id, so user updates edit in place rather than duplicating. Chat history is keyed by timestamp to preserve ordering.

**Per-user vaults as the trust boundary.** Instead of one wallet the agent drains, each user owns a vault with their own limits. An agent error is bounded to one user's configured caps, not the whole product. This is the persistent-memory answer to "how do I use an AI CFO without giving up custody."

**Wallets gate the API.** Every endpoint takes a `wallet` and resolves that user's tenant + vault, so data and spending are scoped per address. The zero-address default is a safe no-op that returns empty state.

**The hard problem — keeping reasoning honest.** The real risk isn't a single bad payment; it's the agent silently ignoring a rule. Pact meets it by making the verdict deterministic and surfaced: the model can propose, but the policy engine's answer is computed, stored, and shown with its memory references. The model cannot override a deny.

## What's real vs pending — the honesty table

The honest table — what is genuinely working, run against real infrastructure, versus what is structural and exercised only by tests.

| Capability | Status |
| --- | --- |
| Decision loop — memory → LLM → policy verdict | Real — runs live, policy is unit-tested |
| Verdicts (Approve / Require approval / Deny) | Real — pure function, tested in `policy.py` |
| Persistent memory tiers (WARM/HOT/COLD) | Real — Sibyl SDK integration |
| Rule upserts, goals create/list/delete | Real — backed by the SDK |
| Chat history persistence | Real |
| Vault lookup from factory | Real — reads live Base Sepolia |
| Per-user `PactVault` + `VaultFactory` contracts | Real — deployed, 31 Foundry tests passing |
| Deposit / withdraw / agent set / limits set | Real — 16 PactVault tests |
| Factory CREATE2, vault count, getVault | Real — 15 VaultFactory tests |
| Vault deploy from UI (wagmi `writeContract`) | Real code, not yet exercised in a full live run |
| Onchain `pay()` execution from the UI flow | Structural code, NOT yet verified end-to-end live with a funded vault |
| The full spend→receipt loop with a real USDC transfer | Pending live proof — a user vault funded + executed has not been fully exercised on mainnet |
| CI for the backend Python and frontend TypeScript | Not yet established |

The contracts are deployed and fully unit-tested.
The backend and frontend are real and run.
What is honestly still to be proven is the one continuous live walk: deploy a vault from the UI, fund it, ask the AI CFO to pay, and watch the receipt land on BaseScan.
Until then, no claim of a working onchain payment is made.

## Tests

### Smart contracts (Foundry) — 31 passing

| Suite | Tests | Covers |
| --- | --- | --- |
| `PactVault.t.sol` | 16 | deposit, withdraw (owner-only), agent pay, per-tx cap, daily cap reset, replay protection, owners/agent/limits setters |
| `VaultFactory.t.sol` | 15 | CREATE2 deploy, per-user vault, duplicate rejection, getVault, vaultCount, setAgent/setDefaults/transferOwnership |

```
cd contracts
forge build
forge test      # 31 passed
```

The backend policy and executor are Python; there is no pytest suite yet, and the frontend has no test runner yet — both are open contributions (see Roadmap).

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

### The one-flow demo

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
| `AGENT_PRIVATE_KEY` | The operational onchain agent key (server-only, never shipped to the browser) |
| `USDC_CONTRACT_ADDRESS` | Base Sepolia USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| `SIBYL_DB_PATH` | Local Sibyl memory db |

Frontend `frontend/.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project id |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | Base Sepolia RPC |
| `NEXT_PUBLIC_VAULT_FACTORY_ADDRESS` | Factory used by the deploy button |

Keep the backend `.env` and the `AGENT_PRIVATE_KEY` out of git (both are already gitignored).

## Deploy

```bash
cd contracts
./deploy.sh <deployer-private-key>   # needs Sepolia ETH
```

The deploy script generates and persists the agent keypair (`backend/.agent_key`), deploys `VaultFactory` via Foundry with CREATE2, and writes the factory address into both backend and frontend env files.
Then users deploy their own vault from the UI (calls `factory.createVault()`), deposit USDC, and the AI CFO executes payments from each user's vault.

## Project layout

```
contracts/     Solidity, Foundry — PactVault + VaultFactory (+ deploy.sh)
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

## Tech stack · Credits · Roadmap

**Tech stack**
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS v4, Framer Motion, wagmi, viem, RainbowKit.
- **Backend**: Python, FastAPI, OpenRouter (free models), web3.py, Sibyl Memory SDK.
- **Smart contracts**: Solidity, Foundry, OpenZeppelin (IERC20 / SafeERC20).
- **Network**: Base Sepolia (chain 84532), USDC.

**Credits**
- Sibyl Memory SDK — persistent, tiered agent memory.
- Base Sepolia — testnet deployment and USDC.
- OpenRouter — free LLM access for the AI CFO.

**Roadmap**
- Prove the full live loop end-to-end: deploy vault from UI → fund → AI CFO pays → receipt on BaseScan.
- Add a pytest suite for `policy.py` and `memory.py`, and a Vitest suite for `lib/api.ts`.
- Approval UX in the frontend for `REQUIRE_APPROVAL` decisions (today the verdict is surfaced, not confirmed in-UI).
- Withdraw and agent / limits management UI (the contract methods exist; the UI only shows deploy/fund today).
- Sendgrid / Discord alert when a payment executes.
- A hosted live deployment of the backend.

## Disclaimer & license

Pact is an educational, demonstration project — not financial advice and not a custodial service.
You always remain the owner of your vault; the agent's authority is bounded by your configured limits and revocable by you (`setAgent`, `withdraw`).
Testnet funds only today — do not point this at a real-money vault without a full audit and hardening.

**License**: MIT.
