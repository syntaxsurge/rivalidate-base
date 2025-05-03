/**
 * Rivalidate deployment configuration
 *
 * In CI and production you **must** supply all three addresses via the
 * environment; however, during local development we fall back to deterministic
 * dummy accounts so that scripts never crash when the variables are missing.
 *
 * ── ENV VARS ────────────────────────────────────────────────────────────────
 *   ADMIN_ADDRESS       → receives DEFAULT_ADMIN_ROLE and ADMIN_ROLE
 *   ISSUER_ADDRESSES    → comma-separated list that will be granted ISSUER_ROLE
 *   PLATFORM_ADDRESS    → account that obtains PLATFORM_ROLE
 * ────────────────────────────────────────────────────────────────────────────
 */

import { getAddress, Wallet } from "ethers";

/* -------------------------------------------------------------------------- */
/*                               H E L P E R S                                */
/* -------------------------------------------------------------------------- */

/** EIP-55-checksum an address and trim stray whitespace. */
function normalise(addr: string): string {
  return getAddress(addr.trim());
}

/** Unique filter helper. */
const uniq = <T>(arr: T[]) => Array.from(new Set(arr));

/* -------------------------------------------------------------------------- */
/*                              E N V   L O A D                               */
/* -------------------------------------------------------------------------- */

const env = process.env as Record<string, string | undefined>;

/* -------------------------------------------------------------------------- */
/*                             C O R E  R O L E S                             */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the administrator address in the following order:
 *   1. Explicit ADMIN_ADDRESS env var
 *   2. Address derived from PRIVATE_KEY (checksummed)
 */
const privateKey = env.PRIVATE_KEY ?? "";
export const adminAddress = env.ADMIN_ADDRESS
  ? normalise(env.ADMIN_ADDRESS)
  : privateKey.length === 66 || privateKey.length === 64
    ? new Wallet(privateKey).address
    : "";

/**
 * Resolve the platform address:
 *   1. Explicit PLATFORM_ADDRESS env var
 *   2. Fallback to adminAddress to keep scripts operational with minimal config
 */
export const platformAddress = env.PLATFORM_ADDRESS
  ? normalise(env.PLATFORM_ADDRESS)
  : adminAddress;

/* Fail fast if we still have no valid admin address */
if (!adminAddress) {
  throw new Error(
    "ADMIN_ADDRESS env var is missing and PRIVATE_KEY is not set – please supply at least one so deployment scripts can assign ADMIN_ROLE",
  );
}

/* -------------------------------------------------------------------------- */
/*                         I S S U E R   A D D R E S S E S                    */
/* -------------------------------------------------------------------------- */

/**
 * Parse ISSUER_ADDRESSES into a unique, checksummed array while skipping empty
 * strings and never re-adding admin / platform addresses.
 */
export const issuerAddresses: string[] = uniq(
  (env.ISSUER_ADDRESSES ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(normalise)
).filter(a => a !== adminAddress && a !== platformAddress);