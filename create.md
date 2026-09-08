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

1. Start the Pact backend and frontend.
2. Connect the user's wallet to Base Sepolia.
3. Ensure the wallet has Base Sepolia ETH for deployment and deposits.
4. Deploy a personal PactVault from the connected wallet.
5. Send Base Sepolia USDC to the displayed vault address.
6. Ensure the Pact testnet relayer has Base Sepolia ETH for gas.
7. Set spending rules and goals through Pact.
8. Ask Pact to make a payment.
9. Sibyl retrieves the user's financial context.
10. Pact's AI proposes a structured action.
11. The deterministic policy engine evaluates the action.
12. Known and trusted payments may be approved automatically when they fit the rules.
13. New or risky recipients return `REQUIRE_APPROVAL`.
14. The user reviews the pending payment on the Payments page.
15. The user clicks `Approve payment` when the request is correct.
16. Pact rechecks Sibyl context, vault balance, and safety limits.
17. The relayer submits the transaction.
18. The vault sends USDC to the recipient.
19. Pact stores the decision, payment event, and transaction hash in Sibyl.
20. The UI displays the final status and BaseScan transaction link.

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

The current local Sibyl database is suitable for development and demonstrations, but production needs durable hosted or mounted storage.

The production backend should run as a persistent service rather than relying only on short-lived serverless functions.

The production system should use a managed relayer or a secure signing service.

Approval requests must require wallet authentication, such as SIWE.

Payment execution needs idempotency keys, nonce management, retry handling, and monitoring.

The agent key must be stored in a secret manager and rotated independently from development keys.

Users should see clear states for pending, approved, submitted, confirmed, failed, and rejected transactions.
