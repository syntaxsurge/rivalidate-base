'use server'

import { withTeam } from '@/lib/auth/middleware'
import { COMMERCE_API_KEY } from '@/lib/config'
import { paySubscription } from '@/lib/contracts/rivalidate'
import { updateTeamCryptoSubscription } from '@/lib/db/queries/queries'

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function keyToPlanName(key: 1 | 2): 'base' | 'plus' {
  return key === 1 ? 'base' : 'plus'
}

/* -------------------------------------------------------------------------- */
/*                     E T H   C H E C K O U T   A C T I O N                  */
/* -------------------------------------------------------------------------- */

/**
 * Executes an on-chain ETH payment and updates the subscription in the database.
 * Expects a `planKey` field ('1' | '2') in the submitted FormData.
 */
export const ethCheckoutAction = withTeam(async (formData, team) => {
  const rawKey = formData.get('planKey')?.toString() ?? ''
  if (rawKey !== '1' && rawKey !== '2') {
    throw new Error('Invalid or missing planKey; expected "1" or "2".')
  }

  const planKey = rawKey === '1' ? (1 as const) : (2 as const)
  const planName = keyToPlanName(planKey)

  const { paidUntil, txHash } = await paySubscription({ planKey })
  await updateTeamCryptoSubscription(team.id, planName, paidUntil)

  return { teamId: team.id, paidUntil, txHash }
})

/* -------------------------------------------------------------------------- */
/*                   C O M M E R C E   C H E C K O U T   A C T I O N          */
/* -------------------------------------------------------------------------- */

/**
 * Verifies a Coinbase Commerce charge, mirrors the payment on-chain,
 * and updates the team subscription record.
 *
 * Required FormData fields: `planKey` ('1' | '2'), `chargeId`.
 */
export const commerceCheckoutAction = withTeam(async (formData, team) => {
  const rawKey = formData.get('planKey')?.toString() ?? ''
  const chargeId = formData.get('chargeId')?.toString() ?? ''

  if (rawKey !== '1' && rawKey !== '2') throw new Error('Invalid planKey.')
  if (!chargeId) throw new Error('Missing chargeId.')
  if (!COMMERCE_API_KEY) throw new Error('COMMERCE_API_KEY not configured.')

  const planKey = rawKey === '1' ? (1 as const) : (2 as const)
  const planName = keyToPlanName(planKey)

  /* ----------------------- Charge verification ----------------------- */
  const verifyRes = await fetch(`https://api.commerce.coinbase.com/charges/${chargeId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CC-Api-Key': COMMERCE_API_KEY,
    },
    cache: 'no-store',
  })

  if (!verifyRes.ok) {
    throw new Error('Failed to verify Commerce charge.')
  }

  const { data } = await verifyRes.json()
  const chargeStatus: string = data?.timeline?.at(-1)?.status ?? data?.status
  const currency: string | undefined = data?.pricing?.local?.currency

  if (chargeStatus !== 'CONFIRMED' || currency !== 'USDC') {
    throw new Error('Charge not confirmed or wrong currency.')
  }

  /* --------------------------- On-chain mirror ------------------------ */
  const { paidUntil, txHash } = await paySubscription({ planKey })
  await updateTeamCryptoSubscription(team.id, planName, paidUntil)

  return { teamId: team.id, paidUntil, txHash, chargeId }
})
