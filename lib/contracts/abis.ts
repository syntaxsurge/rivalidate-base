import type { InterfaceAbi } from 'ethers'
import type { Abi } from 'viem'

import CredentialNFTArtifact from './abis/CredentialNFT.json'
import DIDRegistryArtifact from './abis/DIDRegistry.json'
import SubscriptionManagerArtifact from './abis/SubscriptionManager.json'

/* Intersection type assignable to viem Abi and ethers InterfaceAbi */
type DualAbi = Abi & InterfaceAbi

export const DID_REGISTRY_ABI = DIDRegistryArtifact.abi as unknown as DualAbi
export const CREDENTIAL_NFT_ABI = CredentialNFTArtifact.abi as unknown as DualAbi
export const SUBSCRIPTION_MANAGER_ABI = SubscriptionManagerArtifact.abi as unknown as DualAbi
