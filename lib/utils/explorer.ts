import { CHAIN_ID } from '@/lib/config'

/**
 * Mapping of Base chain IDs to their canonical explorer domains.
 */
const EXPLORER_BASE: Record<number, string> = {
  8453: 'https://basescan.org',
  84532: 'https://sepolia.basescan.org',
}

/**
 * Return the explorer base URL for the supplied chain ID.
 */
export function explorerBase(chainId: number = CHAIN_ID): string {
  return EXPLORER_BASE[chainId] ?? 'https://basescan.org'
}

/**
 * Convenience helper that builds a full transaction URL.
 */
export function txUrl(txHash: string, chainId: number = CHAIN_ID): string {
  const base = explorerBase(chainId).replace(/\/$/, '')
  return `${base}/tx/${txHash}`
}