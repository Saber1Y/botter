# Pact frontend

Next.js (App Router) frontend for Pact — an AI CFO with persistent Sibyl memory and onchain payments on Base Sepolia.

## Getting started

```bash
npm install
cp .env.example .env.local   # edit the four NEXT_PUBLIC_ values
npm run dev
```

Open http://localhost:3000 and connect a Base Sepolia wallet.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API URL (defaults to `http://localhost:8000`) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | Base Sepolia RPC URL |
| `NEXT_PUBLIC_VAULT_FACTORY_ADDRESS` | Factory used by the vault deploy button |

These are compile-time (`NEXT_PUBLIC_`) variables, so they are baked into the production bundle at build time. On Vercel set them in the project dashboard (root directory `frontend`, Next.js preset) and redeploy.

## Routes

- `/` — landing page (hero mockup, product, memory, security).
- `/app` — dashboard: vault balance, budget, goal, activity, deploy/fund banner.
- `/app/chat` — AI CFO chat with typed or spoken input, chat history, sessions, message editing.
- `/app/memory` — rules, goals, and past decisions.
- `/app/goals` — goal create / list / delete.
- `/app/payments` — payment decisions, filters, and approve-from-UI for `REQUIRE_APPROVAL`.

## Voice input

The chat page has a mic button that uses the browser's Web Speech API (`useSpeechRecognition` in `src/hooks/useSpeechRecognition.ts`).
It works in Chrome, Edge, and Safari without any dependency or API key, and places the transcript in the message box for review before sending.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

## Errors and states

The app surfaces clear states for a missing wallet, connecting, wrong network, Sibyl outage (autonomous decisions pause), typing, and failed payments.
"Sibyl memory is unavailable" appears in orange when the backend reports memory down, and the chat input disables rather than making decisions blind.