'use client'

import * as React from 'react'

import { ethers } from 'ethers'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, useWalletClient } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SUBSCRIPTION_MANAGER_ADDRESS } from '@/lib/config'
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'

/* -------------------------------------------------------------------------- */
/*                                   Props                                    */
/* -------------------------------------------------------------------------- */

interface Props {
  /** Current Base-plan price (wei as string) */
  defaultBaseWei: string
  /** Current Plus-plan price (wei as string) */
  defaultPlusWei: string
}

/**
 * Admin form — edit on-chain prices **and** Coinbase Commerce product IDs
 * for the paid tiers. Submits:
 *  1) Contract calls (when price fields changed)
 *  2) PATCH /api/admin/plans with
 *     { base: { priceWei, productId }, plus: { priceWei, productId } }
 */
export default function UpdatePlanPricesForm({
  defaultBaseWei,
  defaultPlusWei,
}: Props) {
  /* -------------------------------------------------------------------- */
  /*                               State                                  */
  /* -------------------------------------------------------------------- */
  const [base, setBase] = React.useState<string>(
    ethers.formatUnits(BigInt(defaultBaseWei), 18),
  )
  const [plus, setPlus] = React.useState<string>(
    ethers.formatUnits(BigInt(defaultPlusWei), 18),
  )
  const [baseProductId, setBaseProductId] = React.useState<string>('') // optional default
  const [plusProductId, setPlusProductId] = React.useState<string>('') // optional default
  const [pending, setPending] = React.useState<boolean>(false)

  /* -------------------------------------------------------------------- */
  /*                        Wallet / wagmi context                         */
  /* -------------------------------------------------------------------- */
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  /* -------------------------------------------------------------------- */
  /*                              Helpers                                 */
  /* -------------------------------------------------------------------- */
  async function updatePlanPrice(planKey: 1 | 2, amountToken: string) {
    if (!walletClient || !address)
      throw new Error('Wallet not connected.')
    const wei = ethers.parseUnits(amountToken, 18)

    await walletClient.writeContract({
      address: SUBSCRIPTION_MANAGER_ADDRESS as `0x${string}`,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: 'setPlanPrice',
      args: [planKey, wei],
      account: address,
    })
  }

  async function patchProductIds(baseWei: bigint, plusWei: bigint) {
    try {
      await fetch('/api/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base: {
            priceWei: baseWei.toString(),
            productId: baseProductId.trim(),
          },
          plus: {
            priceWei: plusWei.toString(),
            productId: plusProductId.trim(),
          },
        }),
        cache: 'no-store',
      })
    } catch (err) {
      /* network errors surfaced via toast in caller */
      throw err
    }
  }

  /* -------------------------------------------------------------------- */
  /*                             Submit                                    */
  /* -------------------------------------------------------------------- */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!isConnected) {
      toast.error('Connect a wallet first.')
      return
    }

    try {
      setPending(true)

      const txs: Promise<unknown>[] = []

      const nextBaseWei = ethers.parseUnits(base, 18)
      const nextPlusWei = ethers.parseUnits(plus, 18)

      /* ----------------- on-chain price updates ------------------ */
      if (nextBaseWei !== BigInt(defaultBaseWei)) {
        txs.push(updatePlanPrice(1, base))
      }
      if (nextPlusWei !== BigInt(defaultPlusWei)) {
        txs.push(updatePlanPrice(2, plus))
      }

      /* Wait for any price transactions to be sent */
      if (txs.length) await Promise.all(txs)

      /* ----------------- product-ID update (always) -------------- */
      await patchProductIds(nextBaseWei, nextPlusWei)

      toast.success('Plan settings updated.')
    } catch (err: any) {
      toast.error(
        err?.shortMessage ??
          err?.message ??
          'Update failed. Check your wallet and network.',
      )
    } finally {
      setPending(false)
    }
  }

  /* -------------------------------------------------------------------- */
  /*                                UI                                    */
  /* -------------------------------------------------------------------- */
  const inputCls =
    'w-full rounded-md border px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        {/* ----------------- Base plan ----------------- */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="base"
              className="mb-1 block text-sm font-medium"
            >
              Base Plan Price&nbsp;(ETH)
            </label>
            <Input
              id="base"
              type="number"
              min="0"
              step="0.000000000000000001"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label
              htmlFor="baseProductId"
              className="mb-1 block text-sm font-medium"
            >
              Base Plan Product&nbsp;ID
            </label>
            <Input
              id="baseProductId"
              value={baseProductId}
              placeholder="PRODUCT_ID_BASE"
              onChange={(e) => setBaseProductId(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* ----------------- Plus plan ---------------- */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="plus"
              className="mb-1 block text-sm font-medium"
            >
              Plus Plan Price&nbsp;(ETH)
            </label>
            <Input
              id="plus"
              type="number"
              min="0"
              step="0.000000000000000001"
              value={plus}
              onChange={(e) => setPlus(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label
              htmlFor="plusProductId"
              className="mb-1 block text-sm font-medium"
            >
              Plus Plan Product&nbsp;ID
            </label>
            <Input
              id="plusProductId"
              value={plusProductId}
              placeholder="PRODUCT_ID_PLUS"
              onChange={(e) => setPlusProductId(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating…
          </>
        ) : (
          'Update Plan Settings'
        )}
      </Button>
    </form>
  )
}