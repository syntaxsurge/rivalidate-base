import { getEnv } from '@/lib/utils/env'

/* -------------------------------------------------------------------------- */
/*                       E N V I R O N M E N T   C O N F I G                  */
/* -------------------------------------------------------------------------- */

export const OPENAI_API_KEY = getEnv('OPENAI_API_KEY') as string
export const ONCHAINKIT_API_KEY = getEnv('NEXT_PUBLIC_ONCHAINKIT_API_KEY') as string

/* ---------------------------- Coinbase Commerce --------------------------- */

export const COMMERCE_PRODUCT_IDS = {
  free: getEnv('NEXT_PUBLIC_COMMERCE_PRODUCT_FREE') as string,
  base: getEnv('NEXT_PUBLIC_COMMERCE_PRODUCT_BASE') as string,
  plus: getEnv('NEXT_PUBLIC_COMMERCE_PRODUCT_PLUS') as string,
}

export const COMMERCE_API_KEY = getEnv('COMMERCE_API_KEY') as string

/* ---------------------------- AgentKit keys ------------------------------ */
export const CDP_API_KEY_NAME = getEnv('CDP_API_KEY_NAME') as string
export const CDP_API_KEY_PRIVATE_KEY = getEnv('CDP_API_KEY_PRIVATE_KEY') as string
export const AGENTKIT_NETWORK_ID = getEnv('NETWORK_ID') as string

/* ---------------------------- Uniswap (Base Sepolia) --------------------- */
export const UNISWAP_ROUTER_ADDRESS = getEnv('UNISWAP_ROUTER_ADDRESS', {
  kind: 'address',
}) as `0x${string}`
export const UNISWAP_FACTORY_ADDRESS = getEnv('UNISWAP_FACTORY_ADDRESS', {
  kind: 'address',
}) as `0x${string}`
export const WETH_ADDRESS = getEnv('WETH_ADDRESS', { kind: 'address' }) as `0x${string}`
export const USDC_ADDRESS = getEnv('USDC_ADDRESS', { kind: 'address' }) as `0x${string}`

/* ------------------------------- Base RPC --------------------------------- */

export const BASE_RPC_URL = getEnv('NEXT_PUBLIC_BASE_RPC_URL') as string

export const CHAIN_ID = getEnv('NEXT_PUBLIC_CHAIN_ID', {
  kind: 'number',
}) as 8453 | 84532

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
