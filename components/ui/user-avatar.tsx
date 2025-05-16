'use client'

import * as React from 'react'

/* -------------------------------------------------------------------------- */
/*                        O N C H A I N K I T  I D E N T I T Y                */
/* -------------------------------------------------------------------------- */

import { Identity, Avatar as OKAvatar, Name as OKName } from '@coinbase/onchainkit/identity'

/* -------------------------------------------------------------------------- */
/*                       L O C A L   U I   F A L L B A C K                    */
/* -------------------------------------------------------------------------- */

import {
  Avatar as UIAvatar,
  AvatarImage as UIAvatarImage,
  AvatarFallback as UIAvatarFallback,
} from '@/components/ui/avatar'
import type { UserAvatarProps as BaseProps } from '@/lib/types/ui'
import { cn } from '@/lib/utils'
import { truncateAddress } from '@/lib/utils/address'
import { getAvatarInitials } from '@/lib/utils/avatar'

/* -------------------------------------------------------------------------- */
/*                                 P R O P S                                  */
/* -------------------------------------------------------------------------- */

/**
 * Extends the existing UI `UserAvatarProps` with optional on-chain address
 * and a flag to toggle Basename rendering.
 */
export type UserAvatarProps = BaseProps & {
  /** 0x… address to resolve Basename and avatar via OnchainKit Identity. */
  address?: `0x${string}`
  /** Show the Basename text next to the avatar (default `true`). */
  showName?: boolean
}

/* -------------------------------------------------------------------------- */
/*                               C O M P O N E N T                            */
/* -------------------------------------------------------------------------- */

/**
 * UserAvatar — displays an on-chain avatar with Basename when `address` is
 * provided; otherwise falls back to initials derived from the supplied name
 * or email.  Fallback label prioritises `name` then a truncated address.
 */
export function UserAvatar({
  address,
  name,
  email,
  className,
  initialsLength = 2,
  square = false,
  showName = true,
  ...rest
}: UserAvatarProps) {
  /* ---------------------- On-chain Identity branch ---------------------- */
  if (address) {
    return (
      <Identity address={address}>
        <span className={cn('inline-flex items-center gap-2', className)} {...rest}>
          <OKAvatar square={square} className='h-7 w-7' />
          {showName && <OKName />}
        </span>
      </Identity>
    )
  }

  /* ---------------------------- Fallback UI ----------------------------- */
  const fallbackText = name?.trim() || (email?.trim() ?? truncateAddress(undefined)) || '—'

  return (
    <UIAvatar className={cn(className)} {...rest}>
      <UIAvatarImage src={undefined} alt={name ?? email ?? 'User avatar'} />
      <UIAvatarFallback className='bg-muted text-foreground'>
        {getAvatarInitials(name, email, initialsLength) || fallbackText}
      </UIAvatarFallback>
    </UIAvatar>
  )
}

export default UserAvatar
