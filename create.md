# Pact Deployment And Payment Flow

## Overview

Pact uses a personal PactVault for each user.

The connected wallet owns the vault.

Pact's agent or relayer submits approved payment transactions.

Sibyl stores the user's financial memory, including rules, goals, decisions, merchant history, and payment events.

```text
User intent
    ↓
Sibyl memory retrieval
    ↓
AI reasoning
    ↓
Deterministic policy validation
    ↓
PactVault execution
    ↓
Payment and decision written back to Sibyl
```

## Current Deployment

The project runs live on testnet.

- Frontend: `https://pact-gules.vercel.app` (Next.js on Vercel).
- Backend: `https://pact-production-e5c0.up.railway.app` (FastAPI on Railway).
- Sibyl memory: persisted on a Railway volume mounted at `/data` (`SIBYL_DB_PATH=/data/memory.db`).
- Contracts: `VaultFactory` `0xC128677e4853401e88723968f636B3A5ea3b14dD` and USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` on Base Sepolia (chain 84532).

The backend's CORS is single-origin and is set to the deployed frontend URL, so the app only answers browser calls from `https://pact-gules.vercel.app`.

The onchain payment loop has been verified live against this deployment: a goal was stored in Sibyl, recalled in a brand-new session, a $10 payment to a new recipient returned `REQUIRE_APPROVAL`, the user approved it, and the vault executed the USDC transfer (tx `0x588f6937e18e400a6a12ba7dda2f6c4e4255e964df43740cc03de5528f6bba38`), verified on BaseScan with the vault balance updated.

## Voice Input

The AI CFO chat accepts typed and spoken instructions.

The mic button in the chat input uses the browser's built-in Web Speech API (Chrome, Edge, and Safari).

No microphone audio leaves the browser and no extra dependency or API key is needed.

The transcribed text is placed in the message box so the user can review it before sending.

## User Wallet Responsibilities

The user's connected wallet owns the user's PactVault.

The user needs native gas currency on the selected network for wallet-signed transactions.

On Base Sepolia, this means Base Sepolia ETH.

On Base mainnet, this means Base mainnet ETH.

The user is responsible for paying gas when they:

- Deploy a PactVault.
- Deposit USDC into a PactVault.
- Change any onchain vault configuration.

The user also needs the correct USDC on the selected network to fund the vault.

Connecting a wallet does not cost gas.

Setting rules, creating goals, and using Sibyl memory are offchain operations in the current architecture.

## Pact Relayer Responsibilities

Pact's agent wallet is separate from the user's connected wallet.

The relayer submits payment transactions after Pact's policy engine authorizes them.

The relayer pays native gas for:

- Automatically approved payments.
- Payments explicitly approved by the user.

The relayer does not own the user's vault funds.

The PactVault holds the user's USDC and enforces its contract-level limits.

Users should not be asked to fund Pact's relayer in the production product.

The current testnet prototype uses the configured `AGENT_PRIVATE_KEY` as a relayer signer.

That signer must be funded with a small amount of testnet ETH before testing payment execution.

The prototype relayer address must not receive real mainnet funds.

Production must use a dedicated production key, secure key management, relayer monitoring, and transaction retry protection.

## Base Sepolia Testnet Flow

1. Open the deployed frontend or start Pact locally and connect a Base Sepolia wallet.
2. Ensure the wallet has Base Sepolia ETH for deployment and deposits.
3. Deploy a personal PactVault from the connected wallet.
4. Send Base Sepolia USDC to the displayed vault address.
5. Set spending rules and goals through Pact (typed or spoken).
6. Ask Pact to make a payment.
7. Sibyl retrieves the user's financial context.
8. Pact's AI proposes a structured action.
9. The deterministic policy engine evaluates the action.
10. Known and trusted payments may be approved automatically when they fit the rules.
11. New or risky recipients return `REQUIRE_APPROVAL`.
12. The user reviews the pending payment on the Payments page.
13. The user clicks `Approve payment` when the request is correct.
14. Pact rechecks Sibyl context, vault balance, and safety limits.
15. The relayer submits the transaction.
16. The vault sends USDC to the recipient.
17. Pact stores the decision, payment event, and transaction hash in Sibyl.
18. The UI displays the final status and BaseScan transaction link.

With the hosted deployment, only the user-side steps (connect, deploy a vault, fund it, chat, approve) are uniquely yours. The backend, Sibyl volume, and funded relayer (`0xd37d192ceeB27517e5Bc87499c64d0420E9d88e5`) are already running, so no local setup is required.

## Base Mainnet Flow

On Base mainnet, the user needs Base mainnet ETH and Base mainnet USDC.

The mainnet user flow is:

```text
Connect wallet
    ↓
User pays Base ETH to deploy the vault
    ↓
User deposits Base USDC into the vault
    ↓
Pact retrieves Sibyl memory
    ↓
Policy evaluates the payment
    ↓
Pact's relayer submits approved payment
    ↓
Vault sends Base USDC
```

Users should not need to know the relayer address.

Users should not need to send ETH to the relayer.

The protocol should fund the relayer or use a gas sponsorship provider.

The production relayer must be isolated from development and testnet keys.

## Approval Behavior

`REQUIRE_APPROVAL` does not mean that transactions are disabled.

It means Pact will not execute that payment autonomously yet.

The user can review and approve the payment from `/app/payments`.

Approval does not bypass hard vault safety limits.

The backend rechecks the current vault balance and policy state before execution.

Blocked payments remain denied.

Payments without enough vault balance remain denied.

The approval action must be authenticated with the user's wallet before production deployment.

## Production Requirements

The live deployment already runs the backend as a persistent Railway service with the Sibyl database on a mounted volume (`SIBYL_DB_PATH=/data/memory.db`), rather than a short-lived serverless function or a local file on a dev machine.

Production would still want:

- A managed relayer or secure signing service instead of a plain key in env.
- Wallet authentication (SIWE) on approval requests — today approval toggles on presence of the address.
- Idempotency keys, nonce management, retry handling, and monitoring for payment execution.
- The agent key in a secret manager, rotated independently from development keys.
- Clear user-facing states for pending, approved, submitted, confirmed, failed, and rejected transactions.
