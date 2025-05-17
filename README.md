# Rivalidate — Trusted Credentials × AI-Powered Hiring

Rivalidate is a **Next.js 15 + TypeScript** platform for verifiable credentials and AI-powered recruiting. Candidates and issuers interact through smart wallets while recruiters manage talent pipelines with built‑in AI assistance.

[![Rivalidate Demo](public/images/rivalidate-demo.png)](https://youtu.be/3jSGbr54D1M)

---

## ✨ Core Features

| Domain     | Capability |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Candidates | • Responsive dashboard for profile, credentials, highlights and résumé<br>• **Auto-generated PDF résumé** with one-click download |
| Recruiters | • Applicant tracking with pipelines & boards<br>• AI fit scoring and credential drill-down |
| Admin      | • User / issuer / pricing management<br>• Platform DID controls |
| API        | • RESTful routes under `/api` with strict auth guards |
| DevEx      | • Monorepo-level typed SQL via Drizzle ORM |

---

## 🖥 User-Journey Snapshot

**Candidate**
- Wallet-first onboarding, mandatory DID mint.
- Upload credentials → UNVERIFIED · PENDING · VERIFIED/REJECTED lifecycle.
- AI-graded skill-checks; passing score triggers on-chain anchor.
- Ask the built-in AI agent to create a DID or request test funds when low on gas.

**Issuer**
- Self-service onboarding; admin approval required.
- Approve or reject verification requests — approval signs and mints the Credential NFT.

**Recruiter**
- Full-text talent search with verified-only toggle.
- Kanban pipelines, AI fit-summaries cached per recruiter × candidate.

**Admin**
- Issuer approvals, role upgrades, credential revocation.
- Platform DID rotation and plan price updates (ETH wei on Base).

---

## 🚀 Quick Start

### Prerequisites

- Node 20+, PNPM 8+
- PostgreSQL 15+

### Setup

```bash
pnpm install
cp .env.example .env                # supply database and API keys
pnpm db:setup && pnpm db:seed       # init & seed database
pnpm dev                            # runs Next.js 15 (Turbopack) on http://localhost:3000
```

### Build & Deploy

```bash
pnpm build
pnpm start
```

---

## 🔑 Environment Variables

| Name                                   | Purpose |
| -------------------------------------- | --------------------------------------------- |
| `POSTGRES_URL`                         | Postgres connection string |
| `AUTH_SECRET`                          | JWT signing secret |
| `OPENAI_API_KEY`                       | API key for GPT‑4o |
| `NEXT_PUBLIC_ONCHAINKIT_API_KEY`       | Public key for OnchainKit widgets |
| `NEXT_PUBLIC_COMMERCE_PRODUCT_FREE`    | Coinbase Commerce product id for free plan |
| `NEXT_PUBLIC_COMMERCE_PRODUCT_BASE`    | Coinbase Commerce product id for base plan |
| `NEXT_PUBLIC_COMMERCE_PRODUCT_PLUS`    | Coinbase Commerce product id for plus plan |
| `COMMERCE_API_KEY`                     | Coinbase Commerce API key |
| `ADMIN_ADDRESS`                        | Address with `ADMIN_ROLE` on contracts |
| `PLATFORM_SIGNER_PRIVATE_KEY`          | Backend signer for platform‑initiated mints |
| `BASE_MAINNET_RPC_URL`                 | RPC endpoint for Base mainnet |
| `BASE_SEPOLIA_RPC_URL`                 | RPC endpoint for Base Sepolia |
| `NEXT_PUBLIC_BASE_RPC_URL`             | Public RPC endpoint used by clients |
| `NEXT_PUBLIC_CHAIN_ID`                 | Chain id of the connected network |
| `NEXT_PUBLIC_DID_REGISTRY_ADDRESS`     | DIDRegistry contract address |
| `NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS`   | CredentialNFT contract address |
| `NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS` | SubscriptionManager contract address |
| `NEXT_PUBLIC_PLATFORM_ISSUER_DID`      | Platform DID used by the site |
| `CDP_API_KEY_NAME`                     | AgentKit API key name |
| `CDP_API_KEY_PRIVATE_KEY`              | AgentKit API key private key |
| `NETWORK_ID`                           | AgentKit network id |
| `UNISWAP_ROUTER_ADDRESS`               | Uniswap V2 router on Base Sepolia |
| `UNISWAP_FACTORY_ADDRESS`              | Uniswap V2 factory on Base Sepolia |
| `WETH_ADDRESS`                         | Wrapped ETH address |
| `USDC_ADDRESS`                         | USDC token address |

---

## 🛠 Technologies Used

- **Next.js 15 App Router** with Partial Prerendering
- **Tailwind 4** + shadcn/ui + Framer Motion
- **Drizzle ORM** for typed PostgreSQL access
- **Wagmi** & **RainbowKit** for smart wallet onboarding
- **AgentKit** for on-chain AI actions
- **OnchainKit** components for Coinbase Commerce payments
- **Vercel Edge** API routes

---

## Tracks Applied

### AI
Our platform integrates an AgentKit-powered assistant backed by GPT‑4o. It can fetch wallet details, query on-chain data, request faucet funds, mint decentralized IDs, and execute custom actions such as swapping ETH for USDC via [lib/agentkit/uniswap-v2-action-provider.ts](lib/agentkit/uniswap-v2-action-provider.ts).

### Stablecoins
Subscriptions are paid in USDC through Coinbase Commerce. Each payment is mirrored on-chain and we store the transaction hash to keep history immutable.

### DeFi
The Uniswap action provider lets the AI agent perform ETH ➜ USDC swaps on Base Sepolia. This demonstrates seamless DeFi interactions inside the hiring workflow.

### Consumer / Showcase
Rivalidate is a complete recruiting platform for candidates and recruiters. Users onboard with smart wallets and mint verifiable credentials as NFTs, showcasing a polished product ready for production.

---

## The Problem It Solves

Credential fraud slows down hiring and reduces trust in candidate résumés. Rivalidate issues verifiable credentials onchain and links them directly to résumé data, allowing recruiters to instantly verify authenticity while candidates retain control over their profile.

---

## Challenges I Ran Into

- Coordinating smart contracts with off-chain Next.js logic
- Handling wallet onboarding flows for both web2 and crypto‑native users
- Integrating AgentKit actions with custom contracts and Uniswap
- Mirroring Coinbase Commerce charges onchain and storing proofs

---

## 🤝 Contributing

1. Fork & clone
2. Create a branch `git checkout -b feat/my-improvement`
3. Commit with [Conventional Commits](https://www.conventionalcommits.org)
4. Open a PR — GitHub Actions will lint and type-check

---

## Final Output

| Item              | Location |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Live Demo         | https://rivalidate-base.vercel.app |
| Demo Video        | https://rivalidate-base.vercel.app/demo-video |
| Demo Video (Mirror) | https://youtu.be/3jSGbr54D1M |
| Presentation Deck | https://rivalidate-base.vercel.app/pitch-deck |
| Presentation Deck (Mirror) | https://www.canva.com/design/DAGma8Zzkiw/L6sLnrb9L8qyjxhDGsnSyg/view?utm_content=DAGma8Zzkiw&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h570be312c9 |
