'use client'

import * as React from 'react'

import * as AvatarPrimitive from '@radix-ui/react-avatar'

import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                T Y P E S                                   */
/* -------------------------------------------------------------------------- */

export interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  /** Render a square avatar (rounded-md) instead of the default circle. */
  square?: boolean
}

export interface AvatarFallbackProps extends React.ComponentProps<typeof AvatarPrimitive.Fallback> {
  /** Match the Avatar square prop for consistent shape. */
  square?: boolean
}

/* -------------------------------------------------------------------------- */
/*                               C O M P O N E N T S                          */
/* -------------------------------------------------------------------------- */

function Avatar({ className, square = false, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden',
        square ? 'rounded-md' : 'rounded-full',
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot='avatar-image'
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, square = false, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot='avatar-fallback'
      className={cn(
        'bg-muted flex size-full items-center justify-center',
        square ? 'rounded-md' : 'rounded-full',
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
