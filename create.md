# Botter Deployment And Payment Flow

## Overview

Botter uses a personal BotterVault for each user.

The connected wallet owns the vault.

Botter's agent or relayer submits approved payment transactions.

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
BotterVault execution
    ↓
Payment and decision written back to Sibyl
```

## Deployment Status

Botter targets BOT Chain Testnet (chainId `968`, RPC `https://rpc.bohr.life`, explorer `https://scan.bohr.life`).

The contracts are deployed on BOT Chain Testnet (`VaultFactory` at `0x338b99e0733E6235f12038fA9402Ce531AE0d9F8`, deploy tx `0x45cbb93b07dce8fa703e907475cde4c2f3c0a61478c97fee4bb3e32502cbb560`). The backend and frontend still need to be hosted:

- Contracts: already deployed; to re-run, use `./contracts/deploy.sh` then set `NEXT_PUBLIC_VAULT_FACTORY_ADDRESS` and `VAULT_FACTORY_ADDRESS` to the returned address.
- Payment token: BOT Chain Testnet USDT `0x75edC9335175Fc0552D51D48439F229c10420fe3` (6 decimals), configured as `TOKEN_CONTRACT_ADDRESS` in the backend and `TOKEN_ADDRESS` in the deploy script.
- Frontend: deploy from `frontend/` to Vercel with `NEXT_PUBLIC_BOT_CHAIN_RPC=https://rpc.bohr.life`.
- Backend: deploy from `backend/` (for example to Railway) with a volume for `SIBYL_DB_PATH`, and set the CORS origin `FRONTEND_URL` to the deployed frontend URL.
- Sibyl memory: persisted on a mounted volume (`SIBYL_DB_PATH=/data/memory.db`).

The previous Pact deployment on Base Sepolia is not reused. Its Base Sepolia transaction `0x588f6937e18e400a6a12ba7dda2f6c4e4255e964df43740cc03de5528f6bba38` only shows that the payment loop worked end to end during development; it is not a BOT Chain Testnet transaction.

## Voice Input

The AI CFO chat accepts typed and spoken instructions.

The mic button in the chat input uses the browser's built-in Web Speech API (Chrome, Edge, and Safari).

No microphone audio leaves the browser and no extra dependency or API key is needed.

The transcribed text is placed in the message box so the user can review it before sending.

## User Wallet Responsibilities

The user's connected wallet owns the user's BotterVault.

The user needs native gas currency on the selected network for wallet-signed transactions.

On BOT Chain Testnet (chainId 968), this means BOT.

On BOT Chain Mainnet (chainId 677), this means BOT.

The user is responsible for paying gas when they:

- Deploy a BotterVault.
- Deposit USDT into a BotterVault.
- Change any onchain vault configuration.

The user also needs the correct USDT on the selected network to fund the vault.

Connecting a wallet does not cost gas.

Setting rules, creating goals, and using Sibyl memory are offchain operations in the current architecture.

## Botter Relayer Responsibilities

Botter's agent wallet is separate from the user's connected wallet.

The relayer submits payment transactions after Botter's policy engine authorizes them.

The relayer pays native gas for:

- Automatically approved payments.
- Payments explicitly approved by the user.

The relayer does not own the user's vault funds.

The BotterVault holds the user's USDT and enforces its contract-level limits.

Users should not be asked to fund Botter's relayer in the production product.

The current testnet prototype uses the configured `AGENT_PRIVATE_KEY` as a relayer signer.

That signer must be funded with a small amount of BOT on BOT Chain Testnet before testing payment execution.

The prototype relayer address must not receive real mainnet funds.

Production must use a dedicated production key, secure key management, relayer monitoring, and transaction retry protection.

## BOT Chain Testnet Flow

1. Open the deployed frontend or start Botter locally and connect a BOT Chain Testnet wallet.
2. Ensure the wallet has BOT for deployment and deposits.
3. Deploy a personal BotterVault from the connected wallet.
4. Send BOT Chain Testnet USDT to the displayed vault address.
5. Set spending rules and goals through Botter (typed or spoken).
6. Ask Botter to make a payment.
7. Sibyl retrieves the user's financial context.
8. Botter's AI proposes a structured action.
9. The deterministic policy engine evaluates the action.
10. Known and trusted payments may be approved automatically when they fit the rules.
11. New or risky recipients return `REQUIRE_APPROVAL`.
12. The user reviews the pending payment on the Payments page.
13. The user clicks `Approve payment` when the request is correct.
14. Botter rechecks Sibyl context, vault balance, and safety limits.
15. The relayer submits the transaction.
16. The vault sends USDT to the recipient.
17. Botter stores the decision, payment event, and transaction hash in Sibyl.
18. The UI displays the final status and BOTScan transaction link.

## BOT Chain Mainnet Flow

On BOT Chain Mainnet (chainId 677), the user needs BOT and the mainnet payment token.

The mainnet user flow is:

```text
Connect wallet
    ↓
User pays BOT to deploy the vault
    ↓
User deposits USDT into the vault
    ↓
Botter retrieves Sibyl memory
    ↓
Policy evaluates the payment
    ↓
Botter's relayer submits approved payment
    ↓
Vault sends USDT
```

Users should not need to know the relayer address.

Users should not need to send BOT to the relayer.

The protocol should fund the relayer or use a gas sponsorship provider.

The production relayer must be isolated from development and testnet keys.

## Approval Behavior

`REQUIRE_APPROVAL` does not mean that transactions are disabled.

It means Botter will not execute that payment autonomously yet.

The user can review and approve the payment from `/app/payments`.

Approval does not bypass hard vault safety limits.

The backend rechecks the current vault balance and policy state before execution.

Blocked payments remain denied.

Payments without enough vault balance remain denied.

The approval action must be authenticated with the user's wallet before production deployment.

## Production Requirements

The backend should run as a persistent service with the Sibyl database on a mounted volume (`SIBYL_DB_PATH=/data/memory.db`), rather than a short-lived serverless function or a local file on a dev machine.

Production would still want:

- A managed relayer or secure signing service instead of a plain key in env.
- Wallet authentication (SIWE) on approval requests - today approval toggles on presence of the address.
- Idempotency keys, nonce management, retry handling, and monitoring for payment execution.
- The agent key in a secret manager, rotated independently from development keys.
- Clear user-facing states for pending, approved, submitted, confirmed, failed, and rejected transactions.
