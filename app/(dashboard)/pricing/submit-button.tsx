'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, useSwitchChain, useWalletClient, usePublicClient } from 'wagmi'

import { Button } from '@/components/ui/button'
import { SUBSCRIPTION_MANAGER_ADDRESS, CHAIN_ID } from '@/lib/config'
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'
import { syncSubscription } from '@/lib/payments/client'
import type { SubmitButtonProps } from '@/lib/types/forms'

/**
 * Pay-in-RBTC subscription checkout button.
 * All USD price-feed logic has been removed for simplicity.
 */
export function SubmitButton({ planKey, priceWei }: SubmitButtonProps) {
  const { address, chain, isConnected } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const router = useRouter()

  const [pending, setPending] = useState(false)

  /* ------------------------------------------------------------------ */
  /*                            H A N D L E R                           */
  /* ------------------------------------------------------------------ */

  async function handleClick() {
    if (pending) return

    if (!SUBSCRIPTION_MANAGER_ADDRESS) {
      toast.error('Subscription manager address missing.')
      return
    }

    if (!isConnected || !walletClient || !address) {
      toast.error('Please connect your wallet first.')
      return
    }

    setPending(true)
    const toastId = toast.loading('Preparing transaction…')

    try {
      /* Network guard — prompt switch when on the wrong chain */
      if (chain?.id !== CHAIN_ID) {
        toast.loading('Switching network…', { id: toastId })
        await switchChainAsync({ chainId: CHAIN_ID })
      }

      /* Write contract */
      toast.loading('Awaiting wallet signature…', { id: toastId })
      const txHash = await walletClient.writeContract({
        address: SUBSCRIPTION_MANAGER_ADDRESS,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'paySubscription',
        args: [address, planKey],
        value: priceWei,
      })

      toast.loading(`Tx sent: ${txHash.slice(0, 10)}…`, { id: toastId })

      /* Confirm receipt */
      await publicClient?.waitForTransactionReceipt({ hash: txHash })

      /* Persist to database */
      await syncSubscription(planKey)

      toast.success('Subscription activated ✅', { id: toastId })
      router.refresh()
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || 'Transaction failed.', { id: toastId })
    } finally {
      setPending(false)
    }
  }

  /* ------------------------------------------------------------------ */
  /*                                UI                                  */
  /* ------------------------------------------------------------------ */

  return (
    <div className='flex flex-col items-center gap-1'>
      <Button
        onClick={handleClick}
        disabled={pending}
        className='flex w-full items-center justify-center rounded-full'
      >
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Processing…
          </>
        ) : (
          <>
            Get Started
            <ArrowRight className='ml-2 h-4 w-4' />
          </>
        )}
      </Button>
    </div>
  )
}
