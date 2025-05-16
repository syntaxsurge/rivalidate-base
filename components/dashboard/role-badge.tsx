'use client'

import { Identity, Name, Badge } from '@coinbase/onchainkit/identity'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                               C O L O U R S                                */
/* -------------------------------------------------------------------------- */

const colorMap: Record<Role, string> = {
  candidate:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  recruiter:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  issuer:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
} as const

/* -------------------------------------------------------------------------- */
/*                                P R O P S                                   */
/* -------------------------------------------------------------------------- */

export interface RoleBadgeProps {
  /** User or team role identifier */
  role?: Role
  /** Optional 0x… address whose Basename should be displayed */
  address?: `0x${string}`
  /** Show verification badge when true */
  verified?: boolean
  /** Extra class names */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                               C O M P O N E N T                            */
/* -------------------------------------------------------------------------- */

/**
 * RoleBadge — displays the user role.
 * When a wallet address is supplied it additionally resolves the Basename
 * and, if `verified` is truthy, appends the OnchainKit <Badge tooltip />.
 */
export function RoleBadge({
  role,
  address,
  verified = false,
  className,
}: RoleBadgeProps) {
  if (!role) return null
  const classes = colorMap[role] ?? 'bg-muted text-foreground/80'

  /* Basename + Badge branch */
  if (address) {
    return (
      <Identity address={address}>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-medium capitalize',
            classes,
            className,
          )}
        >
          {role}
          <Name className='inline-flex items-center gap-1 font-semibold'>
            {verified && <Badge tooltip />}
          </Name>
        </span>
      </Identity>
    )
  }

  /* Default role-only badge */
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-0.5 text-sm font-medium capitalize',
        classes,
        className,
      )}
    >
      {role}
    </span>
  )
}