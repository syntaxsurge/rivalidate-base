import type { PlanKey, PlanMeta } from '@/lib/types/pricing'

/**
 * Canonical order of plans as displayed in the pricing grid.
 */
export const PLAN_KEYS: readonly PlanKey[] = ['free', 'base', 'plus'] as const

/** Native ETH decimals (18) on Base. */
export const RBTC_DECIMALS = 18

/**
 * Immutable price & feature table.
 *
 * ⚠️  IMPORTANT: `productId` values **must** stay in sync with the
 * Coinbase Commerce dashboard. The admin UI (/admin/subscription-plans)
 * lets admins edit product IDs; those edits update runtime env vars and
 * should be reflected here (or via env overrides) before the next deploy.
 *
 * Keep this array **sorted** in display order for the pricing grid.
 * `productId` placeholders are overridden at runtime by
 * NEXT_PUBLIC_COMMERCE_PRODUCT_* env vars.
 */
export const PLAN_META: readonly PlanMeta[] = [
  {
    key: 'free',
    name: 'Free',
    highlight: true,
    priceWei: 0n,
    productId: 'PRODUCT_ID_FREE',
    features: [
      'Unlimited Credentials',
      'Unlimited Skill Passes',
      'Team Workspace',
      'Basic Email Support',
      'Public Recruiter Profile',
    ],
  },
  {
    key: 'base',
    name: 'Base',
    priceWei: 5_000_000_000_000_000_000n, // 0.005 ETH
    productId: 'PRODUCT_ID_BASE',
    features: [
      'Everything in Free',
      'Up to 5 Recruiter Seats',
      '50 AI Skill Checks / month',
      '50 Credential Verifications / month',
      'Advanced Talent Search Filters',
      'Exportable Reports',
    ],
  },
  {
    key: 'plus',
    name: 'Plus',
    priceWei: 10_000_000_000_000_000_000n, // 0.01 ETH
    productId: 'PRODUCT_ID_PLUS',
    features: [
      'Everything in Base',
      'Unlimited Recruiter Seats',
      'Unlimited Skill Checks & Verifications',
      'Custom Branding & Domain',
      'API Access',
      'Priority Issuer Application Review',
    ],
  },
] as const

/**
 * Helper: return strongly-typed plan metadata for a given key.
 */
export function getPlanMeta(key: PlanKey): PlanMeta {
  const meta = PLAN_META.find((p) => p.key === key)
  if (!meta) throw new Error(`Unknown plan key: ${key}`)
  return meta
}
