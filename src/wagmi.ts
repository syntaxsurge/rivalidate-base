import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'

/**
 * getConfig — returns a wagmi configuration strictly limited to the Base mainnet
 * and Base Sepolia testnet and initialises the Coinbase Smart Wallet connector
 * with `preference: 'smartWalletOnly'`, persisting wagmi state to cookies for SSR parity.
 */
export function getConfig() {
  return createConfig({
    chains: [base, baseSepolia],
    connectors: [
      injected(),
      coinbaseWallet({
        appName: 'Rivalidate',
        /** Smart-wallet-only preference ensures users are guided to create or
         * connect a Coinbase Smart Wallet instead of an EOA. */
        preference: 'smartWalletOnly',
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
  })
}

/* -------------------------------------------------------------------------- */
/*                           W A G M I   T Y P I N G                           */
/* -------------------------------------------------------------------------- */

declare module 'wagmi' {
  // Extend wagmi’s global registry so hooks infer the correct config type.
  interface Register {
    config: ReturnType<typeof getConfig>
  }
}
