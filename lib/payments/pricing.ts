import { eq, asc } from 'drizzle-orm'

import { COMMERCE_PRODUCT_IDS } from '@/lib/config'
import { PLAN_META } from '@/lib/constants/pricing'
import { subscriptionManager } from '@/lib/contracts'
import { db } from '@/lib/db/drizzle'
import { planFeatures } from '@/lib/db/schema/pricing'
import type { PlanMeta } from '@/lib/types/pricing'

/* -------------------------------------------------------------------------- */
/*                         Runtime plan-metadata helper                       */
/* -------------------------------------------------------------------------- */

/** Serialisable variant for client components. */
export type PlanMetaSerialised = Omit<PlanMeta, 'priceWei'> & {
  priceWei: string
}

/**
 * Fetch ordered feature strings for a given plan key; falls back to compile-time
 * PLAN_META when the database table is empty (first-run safety).
 */
async function getFeatures(planKey: 'free' | 'base' | 'plus'): Promise<string[]> {
  const rows = await db
    .select({ feature: planFeatures.feature })
    .from(planFeatures)
    .where(eq(planFeatures.planKey, planKey))
    .orderBy(asc(planFeatures.sortOrder))

  if (rows.length) return rows.map((r) => r.feature)

  /* Fallback – bootstrap with PLAN_META definitions */
  const constant = PLAN_META.find((p) => p.key === planKey)
  return constant ? [...constant.features] : []
}

/**
 * Combine on-chain ETH prices with database-driven feature lists and attach
 * Coinbase Commerce product identifiers (env var override).
 */
export async function fetchPlanMeta(): Promise<PlanMetaSerialised[]> {
  const [baseWei, plusWei, freeFeat, baseFeat, plusFeat] = await Promise.all([
    subscriptionManager.planPriceWei(1),
    subscriptionManager.planPriceWei(2),
    getFeatures('free'),
    getFeatures('base'),
    getFeatures('plus'),
  ])

  /* Resolved product-ID overrides from config */
  const PRODUCT_IDS = COMMERCE_PRODUCT_IDS

  /* Resolve constant placeholders */
  const constantMap: Record<'free' | 'base' | 'plus', PlanMeta> = {
    free: PLAN_META.find((p) => p.key === 'free') as PlanMeta,
    base: PLAN_META.find((p) => p.key === 'base') as PlanMeta,
    plus: PLAN_META.find((p) => p.key === 'plus') as PlanMeta,
  }

  return [
    {
      key: 'free',
      name: 'Free',
      highlight: true,
      priceWei: '0',
      features: freeFeat,
      productId: PRODUCT_IDS.free || constantMap.free.productId,
    },
    {
      key: 'base',
      name: 'Base',
      priceWei: baseWei.toString(),
      features: baseFeat,
      productId: PRODUCT_IDS.base || constantMap.base.productId,
    },
    {
      key: 'plus',
      name: 'Plus',
      priceWei: plusWei.toString(),
      features: plusFeat,
      productId: PRODUCT_IDS.plus || constantMap.plus.productId,
    },
  ]
}
