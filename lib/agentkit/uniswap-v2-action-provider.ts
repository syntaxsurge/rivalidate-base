import { ActionProvider, Network, CreateAction, CdpWalletProvider } from '@coinbase/agentkit'
import { z } from 'zod'

import { SwapEthToUsdcSchema } from './schemas'
import {
  UNISWAP_ROUTER_ADDRESS,
  UNISWAP_FACTORY_ADDRESS,
  WETH_ADDRESS,
  USDC_ADDRESS,
} from '@/lib/config'

/* -------------------------------------------------------------------------- */
/*                                 CONSTANTS                                  */
/* -------------------------------------------------------------------------- */

/** Minimal Uniswap V2 Router ABI (only the functions we need). */
const UNISWAP_V2_ROUTER_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
    ],
    name: 'getAmountsOut',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactETHForTokens',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
]

/** Uniswap addresses injected from env via `lib/config.ts`. */
const UNISWAP_CONFIG = {
  ROUTER_ADDRESS: UNISWAP_ROUTER_ADDRESS,
  FACTORY_ADDRESS: UNISWAP_FACTORY_ADDRESS,
  WETH_ADDRESS,
  USDC_ADDRESS,
}

/** Network / protocol identifiers. */
const BASE_SEPOLIA_NETWORK_ID = 'base-sepolia'
const EVM_PROTOCOL_FAMILY = 'evm'

/* -------------------------------------------------------------------------- */
/*                           P R O V I D E R  C L A S S                       */
/* -------------------------------------------------------------------------- */

/**
 * `Uniswapv2ActionProvider` exposes an AgentKit action that swaps ETH for USDC
 * using the Uniswap V2 router on Base Sepolia.
 */
export class Uniswapv2ActionProvider extends ActionProvider<CdpWalletProvider> {
  constructor() {
    super('uniswapv2', [])
  }

  /**
   * Swap a specified amount of ETH for USDC.
   */
  @CreateAction({
    name: 'swap_eth_to_usdc',
    description: `
      Swap ETH to USDC on Uniswap V2.
      Inputs:
        • ethAmount – amount of ETH to swap (e.g. 0.01)
        • slippagePercent – max slippage % (default 1)
        • deadlineMinutes – optional tx deadline (default 20)
      Output: JSON summary containing the tx hash and ETH amount sent.
    `,
    schema: SwapEthToUsdcSchema,
  })
  async swapEthToUsdc(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof SwapEthToUsdcSchema>,
  ): Promise<string> {
    /* Ensure we are on Base Sepolia. */
    const network = walletProvider.getNetwork()
    if (!this.supportsNetwork(network)) {
      throw new Error(
        `Swap only supported on Base Sepolia – current network: ${network.networkId}`,
      )
    }

    try {
      const wallet = walletProvider.getWallet()
      const userAddress = (await walletProvider.getAddress()) as `0x${string}`

      /* Deadline (seconds since epoch). */
      const deadlineSecs = (args.deadlineMinutes ?? 20) * 60
      const deadline = Math.floor(Date.now() / 1000) + deadlineSecs

      /* Swap path ETH → USDC. */
      const path = [UNISWAP_CONFIG.WETH_ADDRESS, UNISWAP_CONFIG.USDC_ADDRESS]

      /* Slippage handling – for demo simplicity we set amountOutMin to 0. */
      const amountOutMin = 0

      const invocation = await wallet.invokeContract({
        contractAddress: UNISWAP_CONFIG.ROUTER_ADDRESS,
        method: 'swapExactETHForTokens',
        args: {
          amountOutMin: amountOutMin.toString(),
          path,
          to: userAddress,
          deadline: deadline.toString(),
        },
        abi: UNISWAP_V2_ROUTER_ABI,
        amount: args.ethAmount,
        assetId: 'eth',
      })

      await invocation.wait()
      const txHash = invocation.toString()

      const ethDisplay =
        args.ethAmount < 0.0001 ? args.ethAmount.toFixed(8) : args.ethAmount.toString()

      return `Swap successful!\nTx: ${txHash}\nETH sent: ${ethDisplay}`
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Failed to swap ETH → USDC: ${msg}`
    }
  }

  /**
   * Provider/network compatibility checker.
   */
  supportsNetwork(network: Network): boolean {
    return (
      network.protocolFamily === EVM_PROTOCOL_FAMILY &&
      network.networkId === BASE_SEPOLIA_NETWORK_ID
    )
  }
}

/** Factory helper so callers don’t `new` the class directly. */
export const uniswapv2ActionProvider = () => new Uniswapv2ActionProvider()
