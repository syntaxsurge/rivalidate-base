'use client'

/**
 * Notify the backend that a subscription payment succeeded so it
 * can update the team’s plan and expiry time.
 *
 * @param planKey  Numeric key of the plan (1 = Base, 2 = Plus)
 * @param method   Payment rail used: 'eth' | 'commerce'
 * @param extra    Optional extras such as the Coinbase Commerce chargeId
 * @returns        true when the sync completed without a network/server error
 */
export async function syncSubscriptionClient(
  planKey: number,
  method: 'eth' | 'commerce',
  extra: { chargeId?: string } = {},
): Promise<boolean> {
  try {
    const body = {
      planKey,
      method,
      ...(extra.chargeId ? { chargeId: extra.chargeId } : {}),
    }

    const res = await fetch('/api/subscription/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    return res.ok
  } catch {
    /* swallow – caller handles UX refresh anyway */
    return false
  }
}