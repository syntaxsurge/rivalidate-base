'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { OnchainKitProvider } from '@coinbase/onchainkit'
import { Checkout, CheckoutButton, CheckoutStatus } from '@coinbase/onchainkit/checkout'
import { base } from 'wagmi/chains'

import { ONCHAINKIT_API_KEY } from '@/lib/config'
import { getConfig } from '@/wagmi'

/**
 * PlanCheckout — renders a Coinbase Commerce checkout flow for the supplied plan.
 * Coinbase Commerce only supports Base **mainnet**, so we wrap the Checkout
 * components in their own OnchainKitProvider that is hard-wired to the Base
 * mainnet chain, regardless of the app-wide testnet configuration.
 *
 * @param planKey    1 = Base, 2 = Plus (mirrors SubscriptionManager keys)
 * @param productId  Coinbase Commerce product identifier
 */
export function PlanCheckout({ planKey, productId }: { planKey: 1 | 2; productId: string }) {
  const router = useRouter()

  /* Lazily memoise the wagmi config to avoid re-creating on every render. */
  const wagmiConfig = useMemo(() => getConfig(), [])

  /* Handle Checkout lifecycle; on successful payment notify backend. */
  async function handleStatus(status: { statusName: string; statusData?: any }) {
    if (status.statusName !== 'success') return
    const chargeId: string | undefined = status.statusData?.chargeId

    try {
      await fetch('/api/subscription/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey, method: 'commerce', chargeId }),
        cache: 'no-store',
      })
    } finally {
      router.refresh()
    }
  }

  return (
    <OnchainKitProvider
      /* Force all nested components to operate on Base mainnet (chainId 8453). */
      apiKey={ONCHAINKIT_API_KEY}
      chain={base as any}
      /* Re-use the project’s wagmi config so the existing wallet connection
         is recognised inside the nested provider. */
      config={{ wagmi: { config: wagmiConfig } } as any}
    >
      <Checkout productId={productId} onStatus={handleStatus}>
        <CheckoutButton coinbaseBranded className='w-full' />
        <CheckoutStatus />
      </Checkout>
    </OnchainKitProvider>
  )
}