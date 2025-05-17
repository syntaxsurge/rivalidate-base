# **Rivalidate Blockchain Package — Base Edition**

This folder is a **stand-alone Hardhat workspace** that compiles, tests, and deploys the Solidity layer powering **Rivalidate** on the **Base** network.

---

## 📂 Folder Structure

| Path                | Description                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| `contracts/`        | Core contracts: `DIDRegistry`, `CredentialNFT`, `SubscriptionManager`. |
| `scripts/`          | One idempotent deploy script per contract **plus** shared helpers.     |
| `.env.example`      | Template listing every variable read by Hardhat & deploy scripts.      |
| `hardhat.config.ts` | Hardhat configuration for `base`, `baseSepolia`, and `localhost`.      |

---

## 🛠 Prerequisites

```bash
pnpm install                 # install dependencies
cp .env.example .env         # create local env file
```

Populate **.env** with at minimum:

- `ADMIN_ADDRESS` — wallet that receives `ADMIN_ROLE`.
- `PLATFORM_SIGNER_PRIVATE_KEY` — backend signer used by server-side mints and admin scripts.
- `PRIVATE_KEY` — matches `ADMIN_ADDRESS` so Hardhat can send transactions.
- `SUBSCRIPTION_PRICE_WEI_BASE` / `SUBSCRIPTION_PRICE_WEI_PLUS` — numeric plan prices in **wei**.
- `BASE_SEPOLIA_RPC_URL` _or_ `BASE_MAINNET_RPC_URL`.
- _(optional)_ `BASESCAN_API_KEY` to enable automatic Basescan verification.

---

## 🔨 Compile & Type Generation

```bash
pnpm hardhat compile     # Solidity → bytecode / ABI
pnpm typechain           # (optional) generate TypeScript typings
```

---

## 🚀 Deployment Flow

Each deploy script prints the contract address **and** writes it to `deployment.log` so you can copy the values straight into the monorepo `.env`.

| #   | Script                         | Purpose                                                                                                                                                            |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `deployDIDRegistry.ts`         | Deploys `DIDRegistry` **and** pre-mints the platform DID. The constructor also grants both admin roles to the _deployer_ to prevent lock-out before role transfer. |
| 2   | `deployCredentialNFT.ts`       | Deploys `CredentialNFT`, grants initial `ISSUER_ROLE`s, and assigns `PLATFORM_ROLE`.                                                                               |
| 3   | `deploySubscriptionManager.ts` | Deploys `SubscriptionManager` with ETH plan prices from `SUBSCRIPTION_PRICE_WEI_BASE` / `SUBSCRIPTION_PRICE_WEI_PLUS`.                                             |

### One-shot helper

From the repository root you can run the convenience wrapper which sequentially executes all three scripts:

```bash
pnpm contracts:deploy baseSepolia   # or base
```

### Verification

If `BASESCAN_API_KEY` is set and you deploy to **Base Mainnet** (`8453`) or **Base Sepolia** (`84532`), each script automatically attempts Basescan verification.

---

## 📝 Environment Keys to Copy

| Purpose                            | Key                                        |
| ---------------------------------- | ------------------------------------------ |
| DID Registry address               | `NEXT_PUBLIC_DID_REGISTRY_ADDRESS`         |
| Credential NFT address             | `NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS`       |
| SubscriptionManager address        | `NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS` |
| Platform DID (minted by script #1) | `NEXT_PUBLIC_PLATFORM_ISSUER_DID`          |

---

## 🔗 Core On-Chain Use Cases

| Contract / Feature               | Rivalidate Workflow Example                                                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Deterministic `did:base` IDs** | User signs once → `DIDRegistry` derives **`did:base:0x…`** which anchors credentials, résumé vectors, and wallet auth.                  |
| **Credential NFTs**              | Issuer (or platform) calls `mintCredential()` with VC hash → immutable ERC-721 on Base → recruiters can verify instantly via Basescan.  |
| **ETH-native Subscriptions**     | `SubscriptionManager` settles plan fees in ETH; UI fetches on-chain price feed; checkout auto-blocks if quote > 60 min old.             |
| **OCY Résumé Vectors**           | Off-chain but referenced on-chain via Credential NFT `tokenURI`, ensuring résumé hash + OCY CID remain tamper-proof.                    |
| **Future ADCS Oracles**          | Score & salary inference results committed on-chain as `bytes32` via upcoming ADCS adaptor — enabling fully transparent hiring metrics. |

---

## 💡 Why Base for Rivalidate?

- **Low gas** — affordable credential minting for both issuers and candidates.
- **High throughput** — supports batched on-chain résumé attestations during hiring spikes.
- **First-class Rivalz modules** — seamless hand-off between on-chain data (Base) and off-chain services (OCY, ADCS, VORD, ROME).

---

Happy building on **Base L2** with **Rivalidate** 🚀
