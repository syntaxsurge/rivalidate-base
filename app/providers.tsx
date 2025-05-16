'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'
import { useAccount } from 'wagmi'

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
 * Providers — root context wrapper supplying OnchainKit (Smart Wallet + Basenames)
 * and project-specific wagmi configuration.  Pass `initialState` from
 * `cookieToInitialState(getConfig(), cookies)` to hydrate wagmi on the server.
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
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{ wagmi: { config: getConfig(), initialState } }}
    >
      {children}
      <WalletSessionSync />
    </OnchainKitProvider>
  )
}