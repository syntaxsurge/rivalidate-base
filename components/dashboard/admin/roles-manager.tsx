'use client'

import { useEffect, useState, useRef } from 'react'

import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  getAddress,
  isAddress,
  keccak256,
  toBytes,
  Address,
  Hex,
} from 'viem'
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DID_REGISTRY_ADDRESS, CHAIN_ID } from '@/lib/config'
import { DID_REGISTRY_ABI } from '@/lib/contracts/abis'

/* -------------------------------------------------------------------------- */
/*                                    UTIL                                    */
/* -------------------------------------------------------------------------- */

/** Map role label → solidity constant string */
const ROLE_LABEL_MAP = {
  ADMIN: 'ADMIN_ROLE',
  AGENT: 'AGENT_ROLE',
} as const

type RoleLabel = keyof typeof ROLE_LABEL_MAP

/** Derive keccak256 hash for a role label (e.g. ADMIN -> keccak256('ADMIN_ROLE')). */
function deriveRoleHash(label: RoleLabel): Hex {
  return keccak256(toBytes(ROLE_LABEL_MAP[label])) as Hex
}

/**
 * Attempt to read `ADMIN_ROLE` / `AGENT_ROLE` from chain; fall back to
 * deterministic keccak256 hash when the call reverts or address is invalid.
 */
async function fetchRoleHash(
  client: ReturnType<typeof usePublicClient>['data'],
  contractAddr: Address,
  fnName: 'ADMIN_ROLE' | 'AGENT_ROLE',
  fallback: Hex,
): Promise<Hex> {
  if (!client) return fallback
  try {
    const onchain = (await client.readContract({
      address: contractAddr,
      abi: DID_REGISTRY_ABI,
      functionName: fnName,
    })) as Hex
    /* Empty response implies wrong byte-code / no function. */
    return onchain && onchain !== '0x' ? (onchain as Hex) : fallback
  } catch {
    return fallback
  }
}

/* -------------------------------------------------------------------------- */
/*                           C O M P O N E N T                                */
/* -------------------------------------------------------------------------- */

type RoleEntry = { role: RoleLabel; addr: string }

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

  /** Retry counter so we can silently retry once or twice before surfacing an error. */
  const attemptsRef = useRef(0)

  /* ------------------------------------------------------------------ */
  /*                         F E T C H   R O L E S                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false

    async function fetchRoles() {
      if (
        !publicClient ||
        !DID_REGISTRY_ADDRESS ||
        !isAddress(DID_REGISTRY_ADDRESS as string)
      ) {
        if (!cancelled) setLoading(false)
        return
      }

      if (!cancelled) setLoading(true)
      attemptsRef.current += 1

      try {
        /* Resolve role identifiers with on-chain lookup + fallback */
        const ADMIN_ROLE = await fetchRoleHash(
          publicClient,
          DID_REGISTRY_ADDRESS as Address,
          'ADMIN_ROLE',
          deriveRoleHash('ADMIN'),
        )
        const AGENT_ROLE = await fetchRoleHash(
          publicClient,
          DID_REGISTRY_ADDRESS as Address,
          'AGENT_ROLE',
          deriveRoleHash('AGENT'),
        )

        async function readMembers(role: Hex, label: RoleLabel) {
          try {
            const count = (await publicClient.readContract({
              address: DID_REGISTRY_ADDRESS as Address,
              abi: DID_REGISTRY_ABI,
              functionName: 'getRoleMemberCount',
              args: [role],
            })) as bigint

            const outs: RoleEntry[] = []
            for (let i = 0n; i < count; i++) {
              const addr = (await publicClient.readContract({
                address: DID_REGISTRY_ADDRESS as Address,
                abi: DID_REGISTRY_ABI,
                functionName: 'getRoleMember',
                args: [role, i],
              })) as Address
              outs.push({ role: label, addr })
            }
            return outs
          } catch {
            /* Return empty on first failures to avoid noisy errors; retry later. */
            return []
          }
        }

        const [admins, agents] = await Promise.all([
          readMembers(ADMIN_ROLE, 'ADMIN'),
          readMembers(AGENT_ROLE, 'AGENT'),
        ])

        const combined = [...admins, ...agents]
        if (!cancelled) setEntries(combined)

        /* If nothing retrieved and we have only attempted once so far, retry after a short delay. */
        if (combined.length === 0 && attemptsRef.current < 3 && !cancelled) {
          setTimeout(fetchRoles, 1500)
          return
        }
      } catch (err) {
        /* Only surface an error after the second failed attempt to avoid scary console noise. */
        if (attemptsRef.current >= 2 && !cancelled) {
          console.error(err)
          toast.error('Failed to fetch role members.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRoles()

    /* Cleanup so any in-flight retries stop after unmount */
    return () => {
      cancelled = true
    }
  }, [publicClient])

  /* ------------------------------------------------------------------ */
  /*                       H E L P E R   ( G R A N T )                  */
  /* ------------------------------------------------------------------ */
  async function grantRole(to: string, label: RoleLabel) {
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

    if (!publicClient || !DID_REGISTRY_ADDRESS) {
      toast.error('Registry contract address not configured.')
      return
    }

    setTxPending(true)
    const toastId = toast.loading('Sending transaction…')

    try {
      const fallbackHash = deriveRoleHash(label)
      const roleBytes = await fetchRoleHash(
        publicClient,
        DID_REGISTRY_ADDRESS as Address,
        ROLE_LABEL_MAP[label],
        fallbackHash,
      )

      const hash = await walletClient.writeContract({
        address: DID_REGISTRY_ADDRESS as Address,
        abi: DID_REGISTRY_ABI,
        functionName: 'grantRole',
        args: [roleBytes, getAddress(to)],
      })

      toast.loading(`Tx sent: ${hash.slice(0, 10)}…`, { id: toastId })
      await publicClient.waitForTransactionReceipt({ hash })
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
            {txPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Plus className='h-4 w-4' />
            )}
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
            {txPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Plus className='h-4 w-4' />
            )}
            Add Agent
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}