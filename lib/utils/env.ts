import { ethers } from 'ethers'

export type EnvKind = 'string' | 'number' | 'address'

/* Detect browser runtime to avoid referencing Node APIs on the client */
const isBrowser = typeof window !== 'undefined'

/* -------------------------------------------------------------------------- */
/*                      E N V I R O N M E N T   H E L P E R S                 */
/* -------------------------------------------------------------------------- */

/**
 * Read and validate an environment variable.
 *
 * In the browser we first look for the key inside `window.__NEXT_PUBLIC_ENV__`,
 * which is hydrated at runtime via <PublicEnvScript>. This removes the need to
 * inline public variables during the build step while still allowing secret
 * server-only vars to throw when missing.
 */
export function getEnv(
  name: string,
  { kind = 'string', optional = false }: { kind?: EnvKind; optional?: boolean } = {},
): string | number | undefined {
  let raw: string | undefined

  if (isBrowser) {
    raw = (window as any).__NEXT_PUBLIC_ENV__?.[name] ?? process.env[name]
  } else {
    raw = process.env[name]
  }

  /* Skip hard failure on the client – secrets are server-only */
  if ((raw === undefined || raw === '') && !optional) {
    if (isBrowser) return undefined
    throw new Error(`Environment variable ${name} is not set`)
  }
  if (raw === undefined || raw === '') return undefined

  switch (kind) {
    case 'number': {
      const num = Number(raw)
      if (Number.isNaN(num)) throw new Error(`${name} is not a valid number`)
      return num
    }
    case 'address':
      try {
        return ethers.getAddress(raw)
      } catch {
        throw new Error(`${name} is not a valid 0x address`)
      }
    default:
      return raw
  }
}

/* -------------------------------------------------------------------------- */
/*                             N E T W O R K   F L A G                         */
/* -------------------------------------------------------------------------- */

/**
 * Convenience boolean indicating if the configured front-end chain ID
 * points to Base (mainnet 8453 or Sepolia 84532).
 */
export const isBaseNetwork: boolean = (() => {
  const cid = getEnv('NEXT_PUBLIC_CHAIN_ID', { kind: 'number', optional: true }) as
    | number
    | undefined
  return cid === 8453 || cid === 84532
})()
