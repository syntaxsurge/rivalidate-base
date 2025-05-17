/**
 * Deploys the CredentialNFT contract, verifies it when possible,
 * and assigns initial roles.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployCredentialNFT.ts --network base|baseSepolia
 */

import { keccak256, toUtf8Bytes } from "ethers";
import { network, run } from "hardhat";

import { adminAddress, issuerAddresses, platformAddress } from "./config";
import type { CredentialNFTInstance } from "../typechain-types";
import { highFeeOverrides } from "./utils/gas";
import { updateEnvLog } from "./utils/logEnv";
import { withRetries } from "./utils/retry";
import { shouldVerifyNetwork } from "./utils/verify";

const CredentialNFT = artifacts.require("CredentialNFT");

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying CredentialNFT to ‘${network.name}’…`);
  const args: [string] = [adminAddress];

  const nft: CredentialNFTInstance = await CredentialNFT.new(...args);
  console.log(`✅  CredentialNFT deployed at ${nft.address}`);

  /* Persist address for env -------------------------------------------------- */
  updateEnvLog("NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS", nft.address);

  /* -------------------------- Optional verification ------------------------- */
  if (shouldVerifyNetwork(network.name)) {
    try {
      await run("verify:verify", {
        address: nft.address,
        constructorArguments: args,
      });
      console.log("🔎  Verified on block-explorer");
    } catch (err) {
      console.warn("⚠️   Verification failed:", (err as Error).message);
    }
  } else {
    console.log("ℹ️  Verification skipped – no explorer API key configured.");
  }

  /* -------------------------- Seed initial roles --------------------------- */
  const ISSUER_ROLE = keccak256(toUtf8Bytes("ISSUER_ROLE"));
  const PLATFORM_ROLE = keccak256(toUtf8Bytes("PLATFORM_ROLE"));

  for (const issuer of issuerAddresses) {
    try {
      await withRetries(async () => nft.grantRole(ISSUER_ROLE, issuer, await highFeeOverrides(adminAddress)), 5_000);
      console.log(`🔑  ISSUER_ROLE granted → ${issuer}`);
    } catch (err) {
      console.warn(`⚠️   Failed to grant ISSUER_ROLE to ${issuer}:`, (err as Error).message);
    }
  }

  try {
    await withRetries(
      async () => nft.grantRole(PLATFORM_ROLE, platformAddress, await highFeeOverrides(adminAddress)),
      5_000
    );
    console.log(`🔑  PLATFORM_ROLE granted → ${platformAddress}`);
  } catch (err) {
    console.warn("⚠️   Failed to grant PLATFORM_ROLE:", (err as Error).message);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌  Deployment failed:", (err as Error).message);
    process.exit(1);
  });
