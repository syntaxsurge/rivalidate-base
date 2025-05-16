import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAuth } from '@/lib/auth/guards'
import { getTeamForUser } from '@/lib/db/queries/queries'
import { updateTeamCryptoSubscription } from '@/lib/db/queries/queries'
import { COMMERCE_API_KEY } from '@/lib/config'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

const bodySchema = z.object({
  planKey: z.number().int().min(1).max(2),
  method: z.enum(['eth', 'commerce']),
  chargeId: z.string().optional(),
})

type PlanName = 'base' | 'plus'

function keyToPlanName(key: 1 | 2): PlanName {
  return key === 1 ? 'base' : 'plus'
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    /* ------------------------- Auth + Team lookup ------------------------ */
    const user = await requireAuth()
    const team = await getTeamForUser(user.id)
    if (!team) {
      return NextResponse.json({ error: 'Team not found.' }, { status: 400 })
    }

    /* ------------------------------- Input ------------------------------- */
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const { planKey, method, chargeId } = parsed.data
    const planName = keyToPlanName(planKey as 1 | 2)

    /* ----------------------------- ETH flow ------------------------------ */
    if (method === 'eth') {
      return NextResponse.json({ ok: true })
    }

    /* ---------------------- Commerce verification ----------------------- */
    if (!chargeId) {
      return NextResponse.json({ error: 'Missing chargeId.' }, { status: 400 })
    }
    if (!COMMERCE_API_KEY) {
      return NextResponse.json({ error: 'COMMERCE_API_KEY not configured.' }, { status: 500 })
    }

    const res = await fetch(`https://api.commerce.coinbase.com/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COMMERCE_API_KEY,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch charge.' }, { status: 502 })
    }

    const { data } = await res.json()
    const chargeStatus: string = data?.timeline?.at(-1)?.status ?? data?.status
    const currency: string | undefined = data?.pricing?.local?.currency

    if (chargeStatus !== 'CONFIRMED' || currency !== 'USDC') {
      return NextResponse.json({ error: 'Charge not confirmed or wrong currency.' }, { status: 400 })
    }

    /* --------------- Update DB subscription (30-day period) -------------- */
    const paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await updateTeamCryptoSubscription(team.id, planName, paidUntil)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('/api/subscription/sync error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}