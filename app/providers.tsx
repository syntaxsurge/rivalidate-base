'use client'

import type { ReactNode } from 'react'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'

import { getConfig } from '@/wagmi'

/**
 * Providers — wraps the app with OnchainKitProvider supplying
 * Coinbase Smart Wallet + Basenames support together with the
 * project-specific wagmi configuration.
 *
 * The optional {@link initialState} prop should be obtained with
 * `cookieToInitialState(getConfig(), cookies)` on the server so
 * that SSR and CSR share identical wagmi cache state.
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
    </OnchainKitProvider>
  )
}