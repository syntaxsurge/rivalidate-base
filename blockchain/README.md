# **Rivalidate Blockchain Package — Base Edition**

This folder is a **stand-alone Hardhat workspace** that compiles, tests and deploys the Solidity layer powering **Rivalidate** on the **Base** network.

---

## 📂 Folder Structure

| Path                | Description                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| `contracts/`        | Main contracts: `DIDRegistry`, `CredentialNFT`, `SubscriptionManager`. |
| `scripts/`          | One idempotent deploy script per contract + shared helpers.            |
| `.env.example`      | Template listing every variable read by Hardhat & scripts.             |
| `hardhat.config.ts` | Hardhat configuration for `base`, `baseSepolia` and `localhost`.       |

---

## 🛠 Prerequisites

```bash
pnpm install                 # install dependencies
cp .env.example .env         # create local env file
```

Edit `.env` and supply at minimum:

- `ADMIN_ADDRESS` &nbsp;— wallet granting `ADMIN_ROLE`.
- `PLATFORM_SIGNER_PRIVATE_KEY` &nbsp;— backend signer for platform-initiated mints.
- `PRIVATE_KEY` &nbsp;— matches `ADMIN_ADDRESS` (used by Hardhat CLI).
- `SUBSCRIPTION_PRICE_WEI_ETH_BASE` / `PLUS` &nbsp;— plan prices in wei.
- `BASE_SEPOLIA_RPC_URL` or `BASE_MAINNET_RPC_URL`.
- _(optional)_ `BASESCAN_API_KEY` for explorer verification.

---

## 🔨 Compile & Type Generation

```bash
pnpm hardhat compile     # Solidity → bytecode / ABI
pnpm typechain           # (optional) generate TypeScript typings
```

---

## 🚀 Deployment Flow

Every script prints the deployed address and appends it to `deployment.log` so you can copy the values into the main `.env`.

| #   | Script                         | Purpose                                                          |
| --- | ------------------------------ | ---------------------------------------------------------------- |
| 1   | `deployDIDRegistry.ts`         | Deploys `DIDRegistry` and optionally pre-mints the platform DID. |
| 2   | `deployCredentialNFT.ts`       | Deploys `CredentialNFT` and grants initial roles.                |
| 3   | `deploySubscriptionManager.ts` | Deploys `SubscriptionManager` with plan prices.                  |

Example (Base Sepolia testnet):

```bash
pnpm hardhat run scripts/deployDIDRegistry.ts          --network baseSepolia
pnpm hardhat run scripts/deployCredentialNFT.ts        --network baseSepolia
pnpm hardhat run scripts/deploySubscriptionManager.ts  --network baseSepolia
```

### Verification

If `BASESCAN_API_KEY` is set and you deploy to **Base Mainnet** (`8453`) or **Base Sepolia** (`84532`), each script attempts automatic Basescan verification.

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

| Contract / Feature              | Rivalidate Workflow Example                                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Deterministic `did:base` IDs** | A user signs once ➜ `DIDRegistry` derives **`did:base:0x…`** ➜ acts as the anchor for credentials, résumé vectors and wallet auth.      |
| **Credential NFTs**             | Issuer calls `CredentialNFT.mintCredential()` with VC hash ➜ immutable ERC-721 on Base ➜ recruiters verify instantly via Basescan.     |
| **ETH-native Subscriptions**    | `SubscriptionManager` settles plan fees in ETH ➜ UI polls on-chain price feed ➜ auto-blocks checkout if quote > 60 min.                |
| **OCY Résumé Vectors**          | Off-chain but referenced on-chain via Credential NFTs’ `tokenURI` ➜ ensures résumé hash + OCY CID remain tamper-proof.                 |
| **Future ADCS Oracles**         | Score & salary inference results committed on-chain as `bytes32` via upcoming ADCS adaptor — enables fully transparent hiring metrics. |

---

## 💡 Why Base for Rivalidate?

- **Low gas** — affordable credential minting for both issuers and candidates.
- **High throughput** — supports batched on-chain résumé attestations during hiring spikes.
- **First-class Rivalz modules** — seamless hand-off between on-chain data (Base) and off-chain services (OCY, ADCS, VORD, ROME).

---

## ❓ FAQ

- **Which Base chain IDs are pre-configured?** — Mainnet `8453` and Sepolia `84532`.
- **How do I change plan prices later?** — Call `SubscriptionManager.setPlanPrice()` from an `ADMIN_ROLE` address.
- **How do I add a new issuer?** — Execute `CredentialNFT.grantRole(ISSUER_ROLE, <address>)`.
- **Want to test locally?** — Run `pnpm hardhat node`, then deploy scripts with `--network localhost`.

---

Happy building on **Base L2** with **Rivalidate** 🚀
