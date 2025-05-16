'use client'

import { useRouter } from 'next/navigation'
import { Checkout, CheckoutButton, CheckoutStatus } from '@coinbase/onchainkit/checkout'

/**
 * PlanCheckout — renders a Coinbase Commerce checkout flow for the supplied plan.
 *
 * @param planKey    1 = Base, 2 = Plus (mirrors SubscriptionManager keys)
 * @param productId  Coinbase Commerce product identifier
 */
export function PlanCheckout({ planKey, productId }: { planKey: 1 | 2; productId: string }) {
  const router = useRouter()

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
    <Checkout productId={productId} onStatus={handleStatus}>
      <CheckoutButton coinbaseBranded className='w-full' />
      <CheckoutStatus />
    </Checkout>
  )
}