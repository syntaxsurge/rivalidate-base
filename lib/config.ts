import { getEnv } from '@/lib/utils/env'

/* -------------------------------------------------------------------------- */
/*                       E N V I R O N M E N T   C O N F I G                  */
/* -------------------------------------------------------------------------- */

export const OPENAI_API_KEY = getEnv('OPENAI_API_KEY') as string

/* ------------------------------- Base RPC --------------------------------- */

export const BASE_RPC_URL = getEnv('NEXT_PUBLIC_BASE_RPC_URL') as string

/** @deprecated Use BASE_RPC_URL instead (retained temporarily for backward compatibility). */
export const RSK_RPC_URL = BASE_RPC_URL

export const CHAIN_ID = getEnv('NEXT_PUBLIC_CHAIN_ID', {
  kind: 'number',
}) as number

/* --------------------------- Core contract addresses ---------------------- */

export const DID_REGISTRY_ADDRESS = getEnv('NEXT_PUBLIC_DID_REGISTRY_ADDRESS', {
  kind: 'address',
}) as `0x${string}`

export const CREDENTIAL_NFT_ADDRESS = getEnv('NEXT_PUBLIC_CREDENTIAL_NFT_ADDRESS', {
  kind: 'address',
}) as `0x${string}`

export const SUBSCRIPTION_MANAGER_ADDRESS = getEnv('NEXT_PUBLIC_SUBSCRIPTION_MANAGER_ADDRESS', {
  kind: 'address',
}) as `0x${string}`

/* ----------------------------- Platform config ---------------------------- */

export const PLATFORM_ISSUER_DID = getEnv('NEXT_PUBLIC_PLATFORM_ISSUER_DID') as string

export const WALLETCONNECT_PROJECT_ID = getEnv('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID') as string
