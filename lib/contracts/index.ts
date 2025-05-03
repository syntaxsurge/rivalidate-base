import { ethers } from 'ethers'
import type { InterfaceAbi } from 'ethers'

import {
  RSK_RPC_URL,
  CHAIN_ID,
  DID_REGISTRY_ADDRESS,
  CREDENTIAL_NFT_ADDRESS,
  SUBSCRIPTION_MANAGER_ADDRESS,
} from '@/lib/config'
import {
  DID_REGISTRY_ABI,
  CREDENTIAL_NFT_ABI,
  SUBSCRIPTION_MANAGER_ABI,
} from '@/lib/contracts/abis'

/* -------------------------------------------------------------------------- */
/*                               R P C  P R O V I D E R                       */
/* -------------------------------------------------------------------------- */

export const provider = new ethers.JsonRpcProvider(RSK_RPC_URL, {
  name: 'base',
  chainId: CHAIN_ID,
})

/* -------------------------------------------------------------------------- */
/*                           G E N E R I C  F A C T O R Y                     */
/* -------------------------------------------------------------------------- */

export const getContract = <T extends ethers.Contract = ethers.Contract>(
  address: string,
  abi: InterfaceAbi,
): T => new ethers.Contract(address, abi, provider) as T

/* -------------------------------------------------------------------------- */
/*                           C O R E  C O N T R A C T S                       */
/* -------------------------------------------------------------------------- */

export const didRegistry = getContract(DID_REGISTRY_ADDRESS, DID_REGISTRY_ABI)
export const credentialNft = getContract(CREDENTIAL_NFT_ADDRESS, CREDENTIAL_NFT_ABI)
export const subscriptionManager = getContract(
  SUBSCRIPTION_MANAGER_ADDRESS,
  SUBSCRIPTION_MANAGER_ABI,
)