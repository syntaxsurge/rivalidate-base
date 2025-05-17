'use client'

import { useEffect, useState } from 'react'

import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi'
import { getAddress, isAddress } from 'viem'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DID_REGISTRY_ADDRESS, CHAIN_ID } from '@/lib/config'
import { DID_REGISTRY_ABI } from '@/lib/contracts/abis'

type RoleEntry = { role: 'ADMIN' | 'AGENT'; addr: string }

export default function RolesManager() {
  const { chain, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { switchChainAsync } = useSwitchChain()

  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<RoleEntry[]>([])

  const [adminInput, setAdminInput] = useState('')
  const [agentInput, setAgentInput] = useState('')
  const [txPending, setTxPending] = useState(false)

  /* ------------------------------------------------------------------ */
  /*                         F E T C H   R O L E S                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    async function fetchRoles() {
      if (!publicClient || !DID_REGISTRY_ADDRESS) return
      setLoading(true)

      try {
        const ADMIN_ROLE: `0x${string}` = await publicClient.readContract({
          address: DID_REGISTRY_ADDRESS,
          abi: DID_REGISTRY_ABI,
          functionName: 'ADMIN_ROLE',
        })
        const AGENT_ROLE: `0x${string}` = await publicClient.readContract({
          address: DID_REGISTRY_ADDRESS,
          abi: DID_REGISTRY_ABI,
          functionName: 'AGENT_ROLE',
        })

        async function readMembers(role: `0x${string}`, label: 'ADMIN' | 'AGENT') {
          const count = (await publicClient.readContract({
            address: DID_REGISTRY_ADDRESS,
            abi: DID_REGISTRY_ABI,
            functionName: 'getRoleMemberCount',
            args: [role],
          })) as bigint

          const outs: RoleEntry[] = []
          for (let i = 0n; i < count; i++) {
            const addr = await publicClient.readContract({
              address: DID_REGISTRY_ADDRESS,
              abi: DID_REGISTRY_ABI,
              functionName: 'getRoleMember',
              args: [role, i],
            })
            outs.push({ role: label, addr: addr as string })
          }
          return outs
        }

        const admins = await readMembers(ADMIN_ROLE, 'ADMIN')
        const agents = await readMembers(AGENT_ROLE, 'AGENT')
        setEntries([...admins, ...agents])
      } catch (err) {
        console.error(err)
        toast.error('Failed to fetch role members.')
      } finally {
        setLoading(false)
      }
    }

    fetchRoles()
  }, [publicClient])

  /* ------------------------------------------------------------------ */
  /*                       H E L P E R   ( G R A N T )                   */
  /* ------------------------------------------------------------------ */
  async function grantRole(to: string, label: 'ADMIN' | 'AGENT') {
    if (!isConnected || !walletClient) {
      toast.error('Connect your wallet first.')
      return
    }
    if (!isAddress(to)) {
      toast.error('Invalid address.')
      return
    }
    if (chain?.id !== CHAIN_ID) {
      await switchChainAsync({ chainId: CHAIN_ID })
    }

    setTxPending(true)
    const toastId = toast.loading('Sending transaction…')

    try {
      const roleSelector =
        label === 'ADMIN'
          ? 'ADMIN_ROLE'
          : 'AGENT_ROLE'

      const roleBytes: `0x${string}` = await publicClient!.readContract({
        address: DID_REGISTRY_ADDRESS,
        abi: DID_REGISTRY_ABI,
        functionName: roleSelector,
      })

      const hash = await walletClient.writeContract({
        address: DID_REGISTRY_ADDRESS,
        abi: DID_REGISTRY_ABI,
        functionName: 'grantRole',
        args: [roleBytes, getAddress(to)],
      })
      toast.loading(`Tx sent: ${hash.slice(0, 10)}…`, { id: toastId })
      await publicClient!.waitForTransactionReceipt({ hash })
      toast.success('Role granted.', { id: toastId })
      setEntries((prev) => [...prev, { role: label, addr: getAddress(to) }])
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message || 'Transaction failed.', { id: toastId })
    } finally {
      setTxPending(false)
    }
  }

  /* ------------------------------------------------------------------ */
  /*                                UI                                  */
  /* ------------------------------------------------------------------ */
  return (
    <section className='space-y-10'>
      <h1 className='text-2xl font-bold'>Access Control Roles</h1>

      {/* Addresses list */}
      <Card>
        <CardHeader>
          <CardTitle>Current Role Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center gap-2 py-6'>
              <Loader2 className='h-5 w-5 animate-spin' />
              Loading…
            </div>
          ) : entries.length === 0 ? (
            <p className='text-muted-foreground'>No role members found.</p>
          ) : (
            <ul className='space-y-2 font-mono text-sm'>
              {entries.map((e, idx) => (
                <li key={idx} className='flex items-center gap-2'>
                  <span
                    className={
                      e.role === 'ADMIN'
                        ? 'rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800'
                        : 'rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800'
                    }
                  >
                    {e.role}
                  </span>
                  <span>{e.addr}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Grant admin */}
      <Card>
        <CardHeader>
          <CardTitle>Add Admin Address</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='adminAddr'>Wallet Address</Label>
            <Input
              id='adminAddr'
              placeholder='0xabc…'
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
            />
          </div>
          <Button
            disabled={txPending}
            onClick={() => grantRole(adminInput.trim(), 'ADMIN')}
            className='flex items-center gap-1'
          >
            {txPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Plus className='h-4 w-4' />}
            Add Admin
          </Button>
        </CardContent>
      </Card>

      {/* Grant agent */}
      <Card>
        <CardHeader>
          <CardTitle>Add Agent Address</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='agentAddr'>Wallet Address</Label>
            <Input
              id='agentAddr'
              placeholder='0xabc…'
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
            />
          </div>
          <Button
            disabled={txPending}
            onClick={() => grantRole(agentInput.trim(), 'AGENT')}
            className='flex items-center gap-1'
          >
            {txPending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Plus className='h-4 w-4' />}
            Add Agent
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}