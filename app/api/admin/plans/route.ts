import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/lib/auth/guards'
import { COMMERCE_PRODUCT_IDS } from '@/lib/config'

/* -------------------------------------------------------------------------- */
/*                                V A L I D A T I O N                         */
/* -------------------------------------------------------------------------- */

const planSchema = z.object({
  priceWei: z.string().regex(/^\d+$/),
  productId: z.string().optional(),
})

const bodySchema = z.object({
  base: planSchema,
  plus: planSchema,
})

/* -------------------------------------------------------------------------- */
/*                                   H A N D L E R                            */
/* -------------------------------------------------------------------------- */

export async function PATCH(req: NextRequest) {
  try {
    /* ------------------------------ Auth check --------------------------- */
    const user = await requireAuth(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    /* ------------------------------- Input ------------------------------- */
    const json = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const {
      base: { productId: basePid },
      plus: { productId: plusPid },
    } = parsed.data

    /* ------------------------------------------------------------------ */
    /*  Mutate runtime env so that subsequent requests use new IDs.       */
    /*  Persistent storage (e.g. DB) can be added later as needed.        */
    /* ------------------------------------------------------------------ */
    if (typeof basePid === 'string' && basePid.length > 0) {
      // update runtime override for Base tier
      COMMERCE_PRODUCT_IDS.base = basePid
    }
    if (typeof plusPid === 'string' && plusPid.length > 0) {
      // update runtime override for Plus tier
      COMMERCE_PRODUCT_IDS.plus = plusPid
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[admin/plans] PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
