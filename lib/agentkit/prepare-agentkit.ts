import * as fs from 'fs'
import * as path from 'path'

import {
  AgentKit,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  CdpWalletProvider,
  erc20ActionProvider,
  pythActionProvider,
  walletActionProvider,
  wethActionProvider,
  WalletProvider,
} from '@coinbase/agentkit'

import {
  CDP_API_KEY_NAME,
  CDP_API_KEY_PRIVATE_KEY,
  AGENTKIT_NETWORK_ID,
} from '@/lib/config'

import { uniswapv2ActionProvider } from './uniswap-v2-action-provider'

/* -------------------------------------------------------------------------- */
/*                         W A L L E T   P E R S I S T E N C E                */
/* -------------------------------------------------------------------------- */

const WALLET_DATA_FILE = '.data/agentkit_wallet.json'

/** Ensure the .data directory exists so the wallet file can be persisted. */
const walletDir = path.dirname(WALLET_DATA_FILE)
if (!fs.existsSync(walletDir)) {
  fs.mkdirSync(walletDir, { recursive: true })
}

/* -------------------------------------------------------------------------- */
/*                         P R E P A R E   A G E N T K I T                    */
/* -------------------------------------------------------------------------- */

/**
 * Initialise AgentKit and return the toolkit along with the WalletProvider.
 * Environment-specific values are loaded from centralised config constants to
 * avoid scattered getEnv() calls across the codebase.
 */
export async function prepareAgentkitAndWalletProvider(): Promise<{
  agentkit: AgentKit
  walletProvider: WalletProvider
}> {
  try {
    const apiKeyName = CDP_API_KEY_NAME
    const apiKeyPrivateKey = CDP_API_KEY_PRIVATE_KEY
    const networkId = AGENTKIT_NETWORK_ID || 'base-sepolia'

    /* ------------------------- Wallet provider -------------------------- */
    let walletDataStr: string | null = null
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, 'utf8')
      } catch (err) {
        console.error('Failed reading wallet data:', err)
      }
    }

    const walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName,
      apiKeyPrivateKey,
      networkId,
      cdpWalletData: walletDataStr ?? undefined,
    })

    /* --------------------------- AgentKit core -------------------------- */
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({ apiKeyName, apiKeyPrivateKey }),
        cdpWalletActionProvider({ apiKeyName, apiKeyPrivateKey }),
        uniswapv2ActionProvider(),
      ],
    })

    /* --------------------------- Persist wallet ------------------------- */
    const exportedWallet = await walletProvider.exportWallet()
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet))

    return { agentkit, walletProvider }
  } catch (err) {
    console.error('prepare-agentkit error:', err)
    throw new Error('Failed to initialise AgentKit')
  }
}