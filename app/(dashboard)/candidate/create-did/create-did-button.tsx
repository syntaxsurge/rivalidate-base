'use client'

import * as React from 'react'

import { ZeroHash } from 'ethers'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi'

import { Button } from '@/components/ui/button'
import { CHAIN_ID, DID_REGISTRY_ADDRESS } from '@/lib/config'
import { DID_REGISTRY_ABI } from '@/lib/contracts/abis'

import { createDidAction } from './actions'

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

/**
 * Mints a Base DID for the connected wallet and stores it on the team.
 * – Uses wagmi so every connector (MetaMask, WalletConnect, Ledger, …) works.
 * – Prompts the wallet to switch to the Base network if needed.
 * – Streams granular toast updates so the user always knows the status.
 */
export function CreateDidButton() {
  const { isConnected, address, chain } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [pending, setPending] = React.useState(false)

  /* ---------------------------------------------------------------------- */
  /*                                HANDLER                                 */
  /* ---------------------------------------------------------------------- */

  async function handleClick() {
    if (pending) return

    /* Basic pre-flight checks */
    if (!DID_REGISTRY_ADDRESS) {
      toast.error('DID Registry address not configured.')
      return
    }
    if (!isConnected || !walletClient) {
      toast.error('Please connect your wallet first.')
      return
    }

    setPending(true)
    const toastId = toast.loading('Preparing transaction…')

    try {
      /* Ensure the user is on the correct chain */
      if (chain?.id !== CHAIN_ID) {
        toast.loading('Switching to Base network…', { id: toastId })
        await switchChainAsync({ chainId: CHAIN_ID })
      }

      /* Ask the wallet to sign & send the tx */
      toast.loading('Requesting signature…', { id: toastId })
      const hash = await walletClient.writeContract({
        address: DID_REGISTRY_ADDRESS,
        abi: DID_REGISTRY_ABI,
        functionName: 'createDID',
        // Pass zero hash for optional docHash parameter
        args: [ZeroHash],
      })

      toast.loading(`Tx sent: ${hash.slice(0, 10)}…`, { id: toastId })

      /* Wait for confirmation */
      await publicClient?.waitForTransactionReceipt({ hash })

      /* Persist the DID in the backend */
      const did = `did:base:${address}`
      const fd = new FormData()
      fd.append('did', did)

      const res = await createDidAction({}, fd)
      if (res && 'error' in res && res.error) {
        toast.error(res.error, { id: toastId })
      } else {
        toast.success(res?.success ?? 'Team DID created successfully.', { id: toastId })
      }
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || 'Transaction failed.'
      toast.error(msg, { id: toastId })
    } finally {
      setPending(false)
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                                   UI                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <Button onClick={handleClick} disabled={pending} className='w-full md:w-max'>
      {pending ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Creating DID…
        </>
      ) : (
        'Create DID for My Team'
      )}
    </Button>
  )
}