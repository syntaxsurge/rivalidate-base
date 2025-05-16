'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useMemo } from 'react'

import { Bot } from 'lucide-react'

import type { SidebarNavItem } from '@/lib/types/components'
import { cn } from '@/lib/utils'

/**
 * Vertical navigation list designed for the dashboard sidebar.
 * If the current group title is "Tools", an "AI Agent" entry is
 * auto-added (unless already present) then all items are alphabetically sorted.
 */
export function SidebarNav({
  title,
  items,
  className,
}: {
  title?: string
  items: SidebarNavItem[]
  className?: string
}) {
  const pathname = usePathname()

  /* Extend Tools group with AI Agent link and sort labels alphabetically. */
  const navItems = useMemo((): SidebarNavItem[] => {
    let list = items
    if (title?.toLowerCase() === 'tools') {
      const exists = items.some((i) => i.href === '/tools/agent')
      if (!exists) {
        list = [...items, { href: '/tools/agent', label: 'AI Agent', icon: Bot } as SidebarNavItem]
      }
    }
    return [...list].sort((a, b) => a.label.localeCompare(b.label))
  }, [items, title])

  if (navItems.length === 0) return null

  return (
    <nav className={cn('mb-4', className)}>
      {title && (
        <p className='text-muted-foreground/70 mt-6 ml-3 text-xs font-semibold tracking-wider uppercase select-none'>
          {title}
        </p>
      )}

      <ul className='mt-2 space-y-1'>
        {navItems.map(({ href, icon: Icon, label, badgeCount }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-muted hover:text-foreground',
                  active
                    ? 'border-primary bg-muted/50 text-foreground border-l-4'
                    : 'text-muted-foreground border-l-4 border-transparent',
                )}
              >
                <Icon className='h-4 w-4 flex-shrink-0' />
                <span className='truncate'>{label}</span>

                {badgeCount !== undefined && badgeCount > 0 && (
                  <span
                    className='bg-primary/90 text-primary-foreground ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-semibold shadow'
                    aria-label={`${badgeCount} pending`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
