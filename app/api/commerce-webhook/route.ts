import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { COMMERCE_API_KEY } from '@/lib/config'
import { updateTeamCryptoSubscription } from '@/lib/db/queries/queries'

/* -------------------------------------------------------------------------- */
/*                        W E B H O O K   H A N D L E R                       */
/* -------------------------------------------------------------------------- */

/**
 * Coinbase Commerce webhook receiver.
 * Verifies `X-CC-Webhook-Signature` (HMAC-SHA256) using the shared
 * secret stored in COMMERCE_API_KEY, then — when the charge is confirmed
 * and paid in USDC — updates the relevant team subscription record.
 *
 * The implementation expects `metadata.planKey` (1 | 2) and
 * `metadata.teamId` to be provided on the Commerce charge so it can map
 * the payment to a team; if either is missing the event is acknowledged
 * but ignored.
 */
export async function POST(req: NextRequest) {
  try {
    if (!COMMERCE_API_KEY) {
      console.error('Commerce webhook: COMMERCE_API_KEY not configured.')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    /* -------------------------------------------------------------- */
    /*                 Read raw body for HMAC verification            */
    /* -------------------------------------------------------------- */
    const raw = await req.text()
    const sigHeader = req.headers.get('X-CC-Webhook-Signature') || ''
    const hmac = createHmac('sha256', COMMERCE_API_KEY).update(raw).digest('hex')

    const valid =
      sigHeader.length === hmac.length &&
      timingSafeEqual(Buffer.from(sigHeader, 'hex'), Buffer.from(hmac, 'hex'))

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(raw)
    const charge = event?.data
    const status: string =
      charge?.timeline?.at(-1)?.status ?? charge?.status ?? 'unresolved'
    const currency: string | undefined = charge?.pricing?.local?.currency

    if (status !== 'CONFIRMED' || currency !== 'USDC') {
      return NextResponse.json({ ok: true }) // acknowledge but ignore
    }

    /* -------------------------------------------------------------- */
    /*        Extract metadata → planKey / teamId (if provided)       */
    /* -------------------------------------------------------------- */
    const meta = charge?.metadata || {}
    const planKey = Number(meta.planKey)
    const teamId = Number(meta.teamId)

    if (planKey === 1 || planKey === 2) {
      if (Number.isFinite(teamId) && teamId > 0) {
        const planName = planKey === 1 ? 'base' : 'plus'
        const paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        try {
          await updateTeamCryptoSubscription(teamId, planName, paidUntil)
        } catch (err) {
          console.error('Commerce webhook DB update failed:', err)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Commerce webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}