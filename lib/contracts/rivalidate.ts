import { ethers } from 'ethers'
import type { Log, LogDescription, InterfaceAbi } from 'ethers'

import {
  DID_REGISTRY_ADDRESS,
  CREDENTIAL_NFT_ADDRESS,
  SUBSCRIPTION_MANAGER_ADDRESS,
} from '@/lib/config'
import {
  DID_REGISTRY_ABI,
  CREDENTIAL_NFT_ABI,
  SUBSCRIPTION_MANAGER_ABI,
} from '@/lib/contracts/abis'
import { provider, didRegistry, credentialNft, subscriptionManager } from '@/lib/contracts/index'
import { toBytes32 } from '@/lib/utils/address'

/* -------------------------------------------------------------------------- */
/*                          S I G N E R   R E S O L V E R                     */
/* -------------------------------------------------------------------------- */

type SignerArgs = { signer?: ethers.Signer; signerAddress?: string }

function resolveSigner({ signer, signerAddress }: SignerArgs = {}): ethers.Signer {
  if (signer) return signer
  if (signerAddress) return new ethers.VoidSigner(ethers.getAddress(signerAddress), provider)
  throw new Error('Signer is required – provide signer or signerAddress')
}

/* -------------------------------------------------------------------------- */
/*                               D I D   M I N T                              */
/* -------------------------------------------------------------------------- */

/**
 * Create a deterministic did:rlz:0x… identifier for the caller on Base L2.
 *
 * @param args.signer   Connected wallet signer (preferred).
 * @param args.docHash  Optional keccak-256 hash of an off-chain DID Document.
 */
export async function createDID(
  args?: SignerArgs & { docHash?: string },
): Promise<{ did: string; txHash: string }> {
  const signer = resolveSigner(args)

  const registryWrite = new ethers.Contract(
    DID_REGISTRY_ADDRESS,
    DID_REGISTRY_ABI as InterfaceAbi,
    signer,
  )

  const receipt = await (await registryWrite.createDID(args?.docHash ?? ethers.ZeroHash)).wait()

  return {
    did: await didRegistry.didOf(await signer.getAddress()),
    txHash: receipt.hash,
  }
}

/* -------------------------------------------------------------------------- */
/*                         C R E D E N T I A L   N F T                        */
/* -------------------------------------------------------------------------- */

/**
 * Anchor a Verifiable Credential hash by minting an ERC-721 on Base.
 */
export async function issueCredential(
  args: SignerArgs & {
    to: string
    vcHash: string
    uri: string
    signature?: string
  },
): Promise<{ tokenId: bigint; txHash: string }> {
  const signer = resolveSigner(args)

  const nftWrite = new ethers.Contract(
    CREDENTIAL_NFT_ADDRESS,
    CREDENTIAL_NFT_ABI as InterfaceAbi,
    signer,
  )

  const receipt = await (
    await nftWrite.mintCredential(
      ethers.getAddress(args.to),
      toBytes32(args.vcHash),
      args.uri,
      args.signature ?? '0x',
    )
  ).wait()

  const parsedLog = receipt.logs
    .map((l: Log): LogDescription | null => {
      try {
        return nftWrite.interface.parseLog(l)
      } catch {
        return null
      }
    })
    .find((d: LogDescription | null): d is LogDescription => !!d && d.name === 'CredentialMinted')

  if (!parsedLog) throw new Error('CredentialMinted event not found')

  return { tokenId: parsedLog.args.tokenId as bigint, txHash: receipt.hash }
}

export async function verifyCredential(tokenId: bigint, expectedVcHash: string): Promise<boolean> {
  return (
    (await credentialNft.getVcHash(tokenId)).toLowerCase() ===
    toBytes32(expectedVcHash).toLowerCase()
  )
}

/* -------------------------------------------------------------------------- */
/*                        S U B S C R I P T I O N   P A Y                     */
/* -------------------------------------------------------------------------- */

export async function paySubscription(
  args: SignerArgs & { planKey: number },
): Promise<{ txHash: string; paidUntil: Date }> {
  const signer = resolveSigner(args)

  const mgrWrite = new ethers.Contract(
    SUBSCRIPTION_MANAGER_ADDRESS,
    SUBSCRIPTION_MANAGER_ABI as InterfaceAbi,
    signer,
  )

  const price: bigint = await subscriptionManager.planPriceWei(args.planKey)
  if (price === 0n) throw new Error('Unknown plan key')

  const receipt = await (
    await mgrWrite.paySubscription(await signer.getAddress(), args.planKey, {
      value: price,
    })
  ).wait()

  const paid = await subscriptionManager.paidUntil(await signer.getAddress())
  return { txHash: receipt.hash, paidUntil: new Date(Number(paid) * 1000) }
}

export async function checkSubscription(team: string): Promise<Date | null> {
  const ts: bigint = await subscriptionManager.paidUntil(ethers.getAddress(team))
  return ts === 0n ? null : new Date(Number(ts) * 1000)
}
