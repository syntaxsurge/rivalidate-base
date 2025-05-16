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
 * WalletSessionSync — lightweight effect that keeps the Next.js session cookie
 * in-sync with the current Coinbase Smart Wallet connection.  When a wallet
 * connects, it pings `/api/auth/wallet-status` so the backend can refresh or
 * create the session; on disconnect it POSTs `/api/auth/signout` to clear the
 * cookie.  Both events trigger `router.refresh()` so server components render
 * with the correct authentication state.
 */
function WalletSessionSync() {
  const { isConnected, address } = useAccount()
  const router = useRouter()

  /* Track the previously connected address to avoid redundant requests. */
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
          if (prevAddressRef.current !== address) {
            prevAddressRef.current = address
            try {
              const res = await fetch(`/api/auth/wallet-status?address=${address}`, {
                method: 'GET',
                cache: 'no-store',
              })
              const json = await res.json().catch(() => ({}))
              /* Refresh only when the user already exists and the backend
                 has updated the session cookie, avoiding unnecessary reloads
                 during first-time onboarding. */
              if (res.ok && json?.exists) router.refresh()
            } catch {
              /* Network hiccups — ignore and retry on next render. */
            }
          }
        }

        /* ----------------------- Wallet disconnected -------------------- */
        if (!isConnected && prevAddressRef.current) {
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
 * and project-specific wagmi configuration.  The optional `initialState`
 * prop should be obtained on the server via
 * `cookieToInitialState(getConfig(), cookies)` to hydrate wagmi’s cache.
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