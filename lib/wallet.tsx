'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef, useState } from 'react'

import { getDefaultConfig, RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { WagmiProvider, http, useAccount, useChainId } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

import { getEnv } from '@/lib/utils/env'

import { WALLETCONNECT_PROJECT_ID } from './config'

/* -------------------------------------------------------------------------- */
/*                             W A G M I   C O N F I G                        */
/* -------------------------------------------------------------------------- */

const wagmiConfig = getDefaultConfig({
  appName: 'Rivalidate',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [base, baseSepolia], // Base Mainnet & Base Sepolia
  transports: {
    [base.id]: http(base.rpcUrls.default.http[0]),
    [baseSepolia.id]: http(
      (getEnv('NEXT_PUBLIC_BASE_RPC_URL', { optional: true }) as string | undefined) ??
        baseSepolia.rpcUrls.default.http[0],
    ),
  },
  ssr: true,
})

const queryClient = new QueryClient()

/* -------------------------------------------------------------------------- */
/*                 W A L L E T   &   S E S S I O N   L I S T E N E R          */
/* -------------------------------------------------------------------------- */

function WalletConnectionListener() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const correctNetwork = chainId === 8453 || chainId === 84532
  const router = useRouter()
  const pathname = usePathname()

  const prevConnected = useRef(isConnected && correctNetwork)

  const sessionFlagKey = address ? `rv_session_${address}` : undefined
  const sessionAlreadyEnsured = () =>
    typeof window !== 'undefined' && sessionFlagKey
      ? sessionStorage.getItem(sessionFlagKey) === '1'
      : false
  const markSessionEnsured = () => {
    if (typeof window !== 'undefined' && sessionFlagKey) {
      sessionStorage.setItem(sessionFlagKey, '1')
    }
  }
  const clearSessionFlag = () => {
    if (typeof window !== 'undefined' && sessionFlagKey) {
      sessionStorage.removeItem(sessionFlagKey)
    }
  }

  /* Disconnect or wrong network → clear session & redirect */
  useEffect(() => {
    const connectedAndCorrect = isConnected && correctNetwork

    if ((prevConnected.current && !connectedAndCorrect) || (isConnected && !correctNetwork)) {
      ;(async () => {
        try {
          await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
        } catch {
          /* ignore */
        } finally {
          clearSessionFlag()
          if (pathname !== '/connect-wallet') router.replace('/connect-wallet')
        }
      })()
    }

    prevConnected.current = connectedAndCorrect
  }, [isConnected, correctNetwork])

  /* First connect → ensure backend session */
  useEffect(() => {
    if (!isConnected || !correctNetwork || !address || sessionAlreadyEnsured()) return
    ;(async () => {
      try {
        const res = await fetch(`/api/auth/wallet-status?address=${address}`, {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))

        if (res.ok && json?.exists) {
          markSessionEnsured()
          if (pathname === '/connect-wallet') {
            router.replace('/dashboard')
          } else {
            router.refresh()
          }
        }
      } catch {
        /* ignore */
      }
    })()
  }, [isConnected, correctNetwork, address])

  return null
}

/* -------------------------------------------------------------------------- */
/*                             R A I N B O W  T H E M E                       */
/* -------------------------------------------------------------------------- */

function RainbowKitWithTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()

  /* Prevent server ↔ client style divergence */
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) return null

  const accent = '#21a1ff' // Rivalidate brand colour
  const rkTheme =
    resolvedTheme === 'dark'
      ? darkTheme({ accentColor: accent, accentColorForeground: '#ffffff' })
      : lightTheme({ accentColor: accent, accentColorForeground: '#ffffff' })

  return (
    <RainbowKitProvider theme={rkTheme}>
      <WalletConnectionListener />
      {children}
    </RainbowKitProvider>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   P R O V I D E R                          */
/* -------------------------------------------------------------------------- */

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitWithTheme>{children}</RainbowKitWithTheme>
      </QueryClientProvider>
    </WagmiProvider>
  )
}