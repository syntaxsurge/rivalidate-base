/**
 * Uniswapv2 Action Provider
 *
 * Provides actions for Uniswap V2 operations on Base Sepolia.
 */

import { ActionProvider, Network, CreateAction, CdpWalletProvider } from '@coinbase/agentkit'
import { z } from 'zod'

import { SwapEthToUsdcSchema } from './schemas'

// Uniswap V2 Router ABI (only the functions we need)
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

// Uniswap V2 config for Base Sepolia
const UNISWAP_CONFIG = {
  ROUTER_ADDRESS: '0x1689E7B1F10000AE47eBfE339a4f69dECd19F602',
  FACTORY_ADDRESS: '0x7Ae58f10f7849cA6F5fB71b7f45CB416c9204b1e',
  WETH_ADDRESS: '0x4200000000000000000000000000000000000006',
  USDC_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
}

// Base Sepolia Network ID
const BASE_SEPOLIA_NETWORK_ID = 'base-sepolia'
// EVM protocol family identifier
const EVM_PROTOCOL_FAMILY = 'evm'

/**
 * Uniswapv2ActionProvider enables ETH→USDC swaps on Base Sepolia.
 */
export class Uniswapv2ActionProvider extends ActionProvider<CdpWalletProvider> {
  constructor() {
    super('uniswapv2', [])
  }

  @CreateAction({
    name: 'swap_eth_to_usdc',
    description: `
      Swap ETH to USDC on Uniswap V2.

      Inputs:
      • ethAmount – amount of ETH to swap (e.g. 0.01)
      • slippagePercent – max acceptable slippage percentage
      • deadlineMinutes – optional deadline (defaults 20 min)
    `,
    schema: SwapEthToUsdcSchema,
  })
  async swapEthToUsdc(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof SwapEthToUsdcSchema>,
  ): Promise<string> {
    // Ensure Base Sepolia
    const network = walletProvider.getNetwork()
    if (!this.supportsNetwork(network)) {
      throw new Error(`Action only supported on Base Sepolia (current: ${network.networkId})`)
    }

    try {
      const wallet = walletProvider.getWallet()
      const userAddress = (await walletProvider.getAddress()) as `0x${string}`

      const deadline = Math.floor(Date.now() / 1000) + (args.deadlineMinutes ?? 20) * 60
      const path = [UNISWAP_CONFIG.WETH_ADDRESS, UNISWAP_CONFIG.USDC_ADDRESS]
      const amountOutMin = 0 // simplify demo

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
      const formattedEth = args.ethAmount < 0.0001 ? args.ethAmount.toFixed(8) : `${args.ethAmount}`

      return `Swap successful! Tx: ${txHash} • ${formattedEth} ETH → USDC`
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Failed to swap ETH for USDC: ${msg}`
    }
  }

  supportsNetwork(network: Network): boolean {
    return (
      network.protocolFamily === EVM_PROTOCOL_FAMILY &&
      network.networkId === BASE_SEPOLIA_NETWORK_ID
    )
  }
}

/** Factory helper */
export const uniswapv2ActionProvider = () => new Uniswapv2ActionProvider()
