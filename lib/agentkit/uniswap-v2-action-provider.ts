import { ActionProvider, Network, CreateAction, CdpWalletProvider } from '@coinbase/agentkit'
import { z } from 'zod'

import {
  UNISWAP_ROUTER_ADDRESS,
  UNISWAP_FACTORY_ADDRESS,
  WETH_ADDRESS,
  USDC_ADDRESS,
} from '@/lib/config'

import { SwapEthToUsdcSchema } from './schemas'

/* -------------------------------------------------------------------------- */
/*                                A B I                                       */
/* -------------------------------------------------------------------------- */

/** Sub-set of the Uniswap V2 router ABI covering only the required functions */
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

/* -------------------------------------------------------------------------- */
/*                          N E T W O R K  C O N S T S                        */
/* -------------------------------------------------------------------------- */

const UNISWAP_CONFIG = {
  ROUTER_ADDRESS: UNISWAP_ROUTER_ADDRESS,
  FACTORY_ADDRESS: UNISWAP_FACTORY_ADDRESS,
  WETH_ADDRESS,
  USDC_ADDRESS,
} as const

const BASE_SEPOLIA_NETWORK_ID = 'base-sepolia'
const EVM_PROTOCOL_FAMILY = 'evm'

/* -------------------------------------------------------------------------- */
/*                              P R O V I D E R                               */
/* -------------------------------------------------------------------------- */

/**
 * `Uniswapv2ActionProvider` exposes a single `swap_eth_to_usdc` action that swaps
 * native ETH for USDC on Uniswap V2 (Base Sepolia only).
 */
export class Uniswapv2ActionProvider extends ActionProvider<CdpWalletProvider> {
  constructor() {
    super('uniswapv2', [])
  }

  /**
   * Swap ETH → USDC on Uniswap V2.
   *
   * @param walletProvider — the CDP wallet abstraction
   * @param args           — validated by {@link SwapEthToUsdcSchema}
   */
  @CreateAction({
    name: 'swap_eth_to_usdc',
    description: `
      Swap ETH to USDC on the Uniswap V2 router deployed to Base Sepolia.
      • ethAmount – amount of ETH to swap (e.g. 0.01)
      • slippagePercent – max slippage %
      • deadlineMinutes – tx deadline, defaults to 20 minutes
    `,
    schema: SwapEthToUsdcSchema,
  })
  async swapEthToUsdc(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof SwapEthToUsdcSchema>,
  ): Promise<string> {
    const network = walletProvider.getNetwork()
    if (!this.supportsNetwork(network)) {
      throw new Error(`Swap only supported on Base Sepolia – current network: ${network.networkId}`)
    }

    try {
      const wallet = walletProvider.getWallet()
      const userAddress = (await walletProvider.getAddress()) as `0x${string}`

      const deadline = Math.floor(Date.now() / 1000) + (args.deadlineMinutes ?? 20) * 60
      const path = [UNISWAP_CONFIG.WETH_ADDRESS, UNISWAP_CONFIG.USDC_ADDRESS]

      // TODO: slippage handling – for hackathon demo we stick to amountOutMin = 0
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
      const formattedEth =
        args.ethAmount < 0.0001 ? args.ethAmount.toFixed(8) : String(args.ethAmount)

      return [
        'Swap completed successfully!',
        `Transaction hash: ${txHash}`,
        `ETH amount: ${formattedEth} ETH`,
      ].join('\n')
    } catch (err) {
      console.error('Error swapping ETH → USDC:', err)
      const msg = err instanceof Error ? err.message : String(err)
      return `Failed to swap ETH for USDC: ${msg}`
    }
  }

  /** Restrict provider to Base Sepolia on the EVM family. */
  supportsNetwork(network: Network): boolean {
    return (
      network.protocolFamily === EVM_PROTOCOL_FAMILY &&
      network.networkId === BASE_SEPOLIA_NETWORK_ID
    )
  }
}

/** Convenience factory — avoids `new` keyword noise at call-sites */
export const uniswapv2ActionProvider = () => new Uniswapv2ActionProvider()
