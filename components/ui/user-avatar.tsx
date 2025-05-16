'use client'

import * as React from 'react'

import {
  Identity,
  Avatar as OKAvatar,
  Name as OKName,
} from '@coinbase/onchainkit/identity'

import {
  Avatar as UIAvatar,
  AvatarImage as UIAvatarImage,
  AvatarFallback as UIAvatarFallback,
} from '@/components/ui/avatar'
import type { UserAvatarProps as BaseProps } from '@/lib/types/ui'
import { cn } from '@/lib/utils'
import { getAvatarInitials } from '@/lib/utils/avatar'

/* -------------------------------------------------------------------------- */
/*                                 P R O P S                                  */
/* -------------------------------------------------------------------------- */

export type UserAvatarProps = BaseProps & {
  /** 0x… address to resolve Basename and avatar via OnchainKit Identity. */
  address?: `0x${string}`
  /** Show the Basename text next to the avatar (default `true`). */
  showName?: boolean
}

/* -------------------------------------------------------------------------- */
/*                               C O M P O N E N T                            */
/* -------------------------------------------------------------------------- */

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
          <OKAvatar className={cn('h-7 w-7', square ? 'rounded-md' : 'rounded-full')} />
          {showName && <OKName />}
        </span>
      </Identity>
    )
  }

  /* ---------------------------- Fallback UI ----------------------------- */
  const initials = getAvatarInitials(name, email, initialsLength)
  const fallbackText =
    initials || name?.trim() || email?.trim() || (address ? (address) : '—')

  return (
    <UIAvatar className={cn(className)} {...rest}>
      <UIAvatarImage src={undefined} alt={name ?? email ?? 'User avatar'} />
      <UIAvatarFallback className='bg-muted text-foreground'>{fallbackText}</UIAvatarFallback>
    </UIAvatar>
  )
}

export default UserAvatar