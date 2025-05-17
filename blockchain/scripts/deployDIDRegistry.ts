/**
 * Deploys DIDRegistry, verifies it when possible, and pre-mints the platform DID.
 *
 * Usage:
 *   pnpm hardhat run blockchain/scripts/deployDIDRegistry.ts --network base|baseSepolia
 */

import hre, { network, run } from "hardhat";
import { ZeroHash } from "ethers";

import { adminAddress, platformAddress } from "./config";
import { updateEnvLog } from "./utils/logEnv";
import { shouldVerifyNetwork } from "./utils/verify";
import type { DIDRegistryInstance } from "../typechain-types";

const DIDRegistry = artifacts.require("DIDRegistry");

async function main(): Promise<void> {
  console.log(`\n🚀  Deploying DIDRegistry to ‘${network.name}’…`);
  const args: [string] = [adminAddress];

  const registry: DIDRegistryInstance = await DIDRegistry.new(...args);
  console.log(`✅  DIDRegistry deployed at ${registry.address}`);

  /* Persist contract address -------------------------------------------------- */
  updateEnvLog("NEXT_PUBLIC_DID_REGISTRY_ADDRESS", registry.address);

  /* ------------------ Mint platform DID via adminCreateDID ------------------ */
  if (platformAddress) {
    try {
      await registry.adminCreateDID(platformAddress, ZeroHash, { from: adminAddress });
      const did = await registry.didOf(platformAddress);
      console.log(`🎉  Platform DID created → ${did}`);
      updateEnvLog("NEXT_PUBLIC_PLATFORM_ISSUER_DID", did);
    } catch (err) {
      console.warn("⚠️  Failed to mint platform DID:", (err as Error).message);
    }
  } else {
    console.log("ℹ️  PLATFORM_ADDRESS env var not set – skipping DID mint");
  }

  /* --------------------------- Optional verification ------------------------ */
  if (shouldVerifyNetwork(network.name)) {
    try {
      await run("verify:verify", {
        address: registry.address,
        constructorArguments: args,
      });
      console.log("🔎  Verified on block-explorer");
    } catch (err) {
      console.warn("⚠️  Verification failed:", (err as Error).message);
    }
  } else {
    console.log("ℹ️  Verification skipped – no explorer API key configured.");
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });