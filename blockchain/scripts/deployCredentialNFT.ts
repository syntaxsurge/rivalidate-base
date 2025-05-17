/**
 * Deploys the CredentialNFT contract, verifies it when possible,
 * and assigns initial roles.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployCredentialNFT.ts --network base|baseSepolia
 */

import hre, { network, run } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

import { adminAddress, issuerAddresses, platformAddress } from "./config";
import { updateEnvLog } from "./utils/logEnv";
import { shouldVerifyNetwork } from "./utils/verify";
import type { CredentialNFTInstance } from "../typechain-types";

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
  const ISSUER_ROLE   = keccak256(toUtf8Bytes("ISSUER_ROLE"));
  const PLATFORM_ROLE = keccak256(toUtf8Bytes("PLATFORM_ROLE"));

  for (const issuer of issuerAddresses) {
    await nft.grantRole(ISSUER_ROLE, issuer);
    console.log(`🔑  ISSUER_ROLE granted → ${issuer}`);
  }

  await nft.grantRole(PLATFORM_ROLE, platformAddress);
  console.log(`🔑  PLATFORM_ROLE granted → ${platformAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });