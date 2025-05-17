import { ActionProvider, Network, CreateAction, CdpWalletProvider } from '@coinbase/agentkit'
import { z } from 'zod'

import { DID_REGISTRY_ADDRESS } from '@/lib/config'
import { DID_REGISTRY_ABI } from '@/lib/contracts/abis'

import { CreateDidSchema, UpdateDidDocumentSchema, AdminCreateDidSchema } from './schemas'

const EVM_PROTOCOL_FAMILY = 'evm'
const SUPPORTED_NETWORKS = new Set(['base', 'base-sepolia'])

export class DidRegistryActionProvider extends ActionProvider<CdpWalletProvider> {
  constructor() {
    super('did_registry', [])
  }

  @CreateAction({
    name: 'create_did',
    description: 'Mint a new Base DID for the connected wallet on the Rivalidate DID Registry.',
    schema: CreateDidSchema,
  })
  async createDid(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof CreateDidSchema>,
  ): Promise<string> {
    const network = walletProvider.getNetwork()
    if (!this.supportsNetwork(network)) {
      throw new Error(
        `DID registry is deployed on Base only – current network: ${network.networkId}`,
      )
    }

    const wallet = walletProvider.getWallet()
    const userAddress = (await walletProvider.getAddress()) as `0x${string}`

    if (!DID_REGISTRY_ADDRESS) {
      throw new Error('DID_REGISTRY_ADDRESS is not configured.')
    }
    const registryAddr = DID_REGISTRY_ADDRESS as `0x${string}`

    const invocation = await wallet.invokeContract({
      contractAddress: registryAddr,
      method: 'createDID',
      args: { docHash: args.docHash },
      abi: DID_REGISTRY_ABI as any,
    })

    await invocation.wait()

    const did = `did:base:${userAddress}`
    return `DID created successfully → ${did}`
  }

  @CreateAction({
    name: 'update_did_document',
    description: 'Update the DID document URI/hash for the caller’s Base DID.',
    schema: UpdateDidDocumentSchema,
  })
  async updateDidDocument(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof UpdateDidDocumentSchema>,
  ): Promise<string> {
    const network = walletProvider.getNetwork()
    if (!this.supportsNetwork(network)) {
      throw new Error(
        `DID registry is deployed on Base only – current network: ${network.networkId}`,
      )
    }

    const wallet = walletProvider.getWallet()

    if (!DID_REGISTRY_ADDRESS) {
      throw new Error('DID_REGISTRY_ADDRESS is not configured.')
    }
    const registryAddr = DID_REGISTRY_ADDRESS as `0x${string}`

    const invocation = await wallet.invokeContract({
      contractAddress: registryAddr,
      method: 'setDocument',
      args: { uri: args.uri, hash: args.docHash },
      abi: DID_REGISTRY_ABI as any,
    })

    await invocation.wait()

    return 'DID document updated successfully.'
  }

  /* -------------------------------------------------------------------- */
  /*               P R I V I L E G E D   D I D   A S S I G N              */
  /* -------------------------------------------------------------------- */

  @CreateAction({
    name: 'assign_did_to_address',
    description: 'Assign a new Base DID to the specified wallet address using admin privileges.',
    schema: AdminCreateDidSchema,
  })
  async assignDidToAddress(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof AdminCreateDidSchema>,
  ): Promise<string> {
    const network = walletProvider.getNetwork()
    if (!this.supportsNetwork(network)) {
      throw new Error(
        `DID registry is deployed on Base only – current network: ${network.networkId}`,
      )
    }

    if (!DID_REGISTRY_ADDRESS) {
      throw new Error('DID_REGISTRY_ADDRESS is not configured.')
    }
    const registryAddr = DID_REGISTRY_ADDRESS as `0x${string}`

    const wallet = walletProvider.getWallet()

    try {
      const invocation = await wallet.invokeContract({
        contractAddress: registryAddr,
        method: 'adminCreateDID',
        args: { owner: args.owner as `0x${string}`, docHash: args.docHash },
        abi: DID_REGISTRY_ABI as any,
      })

      await invocation.wait()

      const did = `did:base:${args.owner.toLowerCase()}`
      return `DID assigned successfully → ${did}`
    } catch (err: any) {
      const msg = err?.message || String(err)
      throw new Error(`Failed to assign DID: ${msg}`)
    }
  }

  supportsNetwork(network: Network): boolean {
    return (
      network.protocolFamily === EVM_PROTOCOL_FAMILY &&
      typeof network.networkId === 'string' &&
      SUPPORTED_NETWORKS.has(network.networkId)
    )
  }
}

export const didRegistryActionProvider = () => new DidRegistryActionProvider()
