'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'viem/chains'
import { useAccount } from 'wagmi'

import ChatWidget from '@/components/agent/chat-widget'
import { ONCHAINKIT_API_KEY } from '@/lib/config'
import { getConfig } from '@/wagmi'

/* -------------------------------------------------------------------------- */
/*                         W A L L E T   S E S S I O N   S Y N C              */
/* -------------------------------------------------------------------------- */

/**
 * WalletSessionSync — ensures the Next.js session cookie and the browser-side
 * sessionStorage flag stay consistent with the current Smart Wallet state.
 *
 * A successful server-side session validation sets `rv_ok_session_${address}`
 * so subsequent page loads skip redundant validation calls; disconnecting
 * removes the flag to force a fresh handshake on the next connection.
 */
function WalletSessionSync() {
  const { isConnected, address } = useAccount()
  const router = useRouter()

  /* Track previously connected address to detect changes across renders. */
  const prevAddressRef = useRef<string | null>(null)
  const syncingRef = useRef(false)

  useEffect(() => {
    /* Prevent concurrent sync attempts. */
    if (syncingRef.current) return
    syncingRef.current = true
    ;(async () => {
      try {
        /* ----------------------- Wallet connected ----------------------- */
        if (isConnected && address) {
          const sessionKey = `rv_ok_session_${address.toLowerCase()}`
          /* Skip server ping when flag already present for this session. */
          if (!sessionStorage.getItem(sessionKey)) {
            prevAddressRef.current = address
            try {
              const res = await fetch(`/api/auth/wallet-status?address=${address}`, {
                method: 'GET',
                cache: 'no-store',
              })
              const json = await res.json().catch(() => ({}))
              if (res.ok && json?.exists) {
                sessionStorage.setItem(sessionKey, '1')
                router.refresh()
              }
            } catch {
              /* Network hiccups — ignore and retry on next render. */
            }
          } else {
            prevAddressRef.current = address
          }
        }

        /* ----------------------- Wallet disconnected -------------------- */
        if (!isConnected && prevAddressRef.current) {
          const oldKey = `rv_ok_session_${prevAddressRef.current.toLowerCase()}`
          sessionStorage.removeItem(oldKey)
          prevAddressRef.current = null
          try {
            await fetch('/api/auth/signout', { method: 'POST' })
          } catch {
            /* Best-effort logout; continue regardless. */
          }
          router.refresh()
        }
      } finally {
        syncingRef.current = false
      }
    })()
  }, [isConnected, address, router])

  return null
}

/* -------------------------------------------------------------------------- */
/*                                 P R O V I D E R S                          */
/* -------------------------------------------------------------------------- */

/**
 * Providers — root context wrapper supplying OnchainKit (Smart Wallet + Basenames),
 * global ChatWidget and project-specific wagmi configuration.
 * Pass `initialState` from `cookieToInitialState(getConfig(), cookies)` to
 * hydrate wagmi on the server.
 */
export function Providers({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: unknown
}) {
  return (
    <OnchainKitProvider
      apiKey={ONCHAINKIT_API_KEY}
      chain={base as any}
      config={
        {
          wagmi: { config: getConfig(), initialState },
          appearance: {
            name: 'Rivalidate',
            logo: '/images/rivalidate-logo.png',
          },
        } as any
      }
    >
      {children}
      <WalletSessionSync />
      {/* Floating AI Agent widget (persists across pages) */}
      <ChatWidget />
    </OnchainKitProvider>
  )
}
