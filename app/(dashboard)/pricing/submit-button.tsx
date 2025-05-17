'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAccount,
  useSwitchChain,
  useWalletClient,
  usePublicClient,
} from 'wagmi'
import type { WalletClient } from 'viem'
import { base, baseSepolia } from 'wagmi/chains'

import { Button } from '@/components/ui/button'
import {
  SUBSCRIPTION_MANAGER_ADDRESS,
  CHAIN_ID,
} from '@/lib/config'
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'
import { syncSubscriptionClient } from '@/lib/payments/client'
import type { SubmitButtonProps } from '@/lib/types/forms'

/* -------------------------------------------------------------------------- */
/*                       R E S O L V E   T A R G E T   C H A I N              */
/* -------------------------------------------------------------------------- */

/**
 * All on-platform ETH payments are settled on Base Sepolia (id 84532) in
 * non-production environments.  We derive the full wagmi chain object so we
 * can  (a) switch the wallet if needed and (b) pass it explicitly to Viem.
 */
const TARGET_CHAIN = CHAIN_ID === 84532 ? baseSepolia : base

/* -------------------------------------------------------------------------- */
/*                                C O M P O N E N T                           */
/* -------------------------------------------------------------------------- */

/**
 * Pay-in-ETH subscription checkout button that auto-switches to
 * Base Sepolia and submits the transaction.
 */
export function SubmitButton({ planKey, priceWei }: SubmitButtonProps) {
  const { address, chain, isConnected } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const router = useRouter()

  const [pending, setPending] = useState(false)

  /* ------------------------------------------------------------------ */
  /*                           H A N D L E R                            */
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
      /* Prompt network switch when on the wrong chain */
      if (chain?.id !== TARGET_CHAIN.id) {
        toast.loading(`Switching to ${TARGET_CHAIN.name}…`, { id: toastId })
        await switchChainAsync({ chainId: TARGET_CHAIN.id })
      }

      /* Write contract — always specify the chain to avoid mismatch */
      toast.loading('Awaiting wallet signature…', { id: toastId })

      const txHash = await (walletClient as WalletClient).writeContract({
        account: address as `0x${string}`,
        address: SUBSCRIPTION_MANAGER_ADDRESS,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'paySubscription',
        args: [address as `0x${string}`, planKey],
        value: priceWei,
        chain: TARGET_CHAIN
      })

      toast.loading(`Tx sent: ${txHash.slice(0, 10)}…`, { id: toastId })

      /* Confirm receipt */
      await publicClient?.waitForTransactionReceipt({ hash: txHash })

      /* Persist to database */
      await syncSubscriptionClient(planKey, 'eth')

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
            Pay with ETH
            <ArrowRight className='ml-2 h-4 w-4' />
          </>
        )}
      </Button>
    </div>
  )
}
