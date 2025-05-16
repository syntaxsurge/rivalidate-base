'use client'

import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletAdvancedWalletActions,
  WalletAdvancedAddressDetails,
  WalletAdvancedTransactionActions,
  WalletAdvancedTokenHoldings,
} from '@coinbase/onchainkit/wallet'
import { Avatar, Name, Address, Identity } from '@coinbase/onchainkit/identity'

import { ChevronDown, Check } from 'lucide-react'
import { useChainId, useSwitchChain } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                               C H A I N  D A T A                           */
/* -------------------------------------------------------------------------- */

type ChainInfo = {
  id: number
  name: string
  shortName: string
}

/** Limited to Base mainnet and Base Sepolia as enforced by wagmi config. */
const CHAINS: ChainInfo[] = [
  { id: base.id, name: 'Base', shortName: 'Mainnet' },
  { id: baseSepolia.id, name: 'Base Sepolia', shortName: 'Sepolia' },
]

/* Simple Base logo – same SVG for both networks (colour may vary via CSS if desired) */
function BaseLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      viewBox='0 0 28 28'
      className={className}
    >
      <g fill='none' fillRule='evenodd'>
        <path
          fill='#0052FF'
          fillRule='nonzero'
          d='M14 28a14 14 0 1 0 0-28 14 14 0 0 0 0 28Z'
        />
        <path
          fill='#FFF'
          d='M13.967 23.86c5.445 0 9.86-4.415 9.86-9.86 0-5.445-4.415-9.86-9.86-9.86-5.166 0-9.403 3.974-9.825 9.03h14.63v1.642H4.142c.413 5.065 4.654 9.047 9.826 9.047Z'
        />
      </g>
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                           C H A I N  S W I T C H E R                       */
/* -------------------------------------------------------------------------- */

function ChainSwitcher() {
  const currentChainId = useChainId()
  const { switchChain, isPending, pendingChainId } = useSwitchChain()

  const current = CHAINS.find((c) => c.id === currentChainId) ?? CHAINS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm font-medium',
            'bg-background hover:bg-muted transition-colors px-4 py-3',
          )}
          aria-label='Select network'
        >
          <BaseLogo className='h-4 w-4' />
          <span className='hidden sm:inline'>
            {current.name}
            <span className='ml-1 text-muted-foreground'>({current.shortName})</span>
          </span>
          <ChevronDown className='h-3 w-3' />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-48'>
        {CHAINS.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onSelect={() => {
              if (chain.id !== currentChainId) switchChain({ chainId: chain.id })
            }}
            disabled={isPending && pendingChainId === chain.id}
            className='flex items-center gap-2'
          >
            <BaseLogo className='h-4 w-4 flex-shrink-0' />
            <span className='flex-1'>
              {chain.name} <span className='text-muted-foreground'>({chain.shortName})</span>
            </span>
            {chain.id === currentChainId && <Check className='h-4 w-4 text-primary' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------- */
/*                              W A L L E T  M E N U                          */
/* -------------------------------------------------------------------------- */

/**
 * WalletMenu — Smart Wallet connect button with chain selector and full dropdown.
 * Re-usable across header, connect-wallet page, etc.
 */
export default function WalletMenu() {
  return (
    <div className='flex items-center gap-2'>
      {/* Chain selector */}
      <ChainSwitcher />

      {/* Wallet connect + dropdown */}
      <Wallet>
        <ConnectWallet disconnectedLabel='Connect'>
          <Avatar className='h-6 w-6' />
          <Name />
        </ConnectWallet>

        <WalletDropdown>
          <Identity className='px-4 pt-3 pb-2' hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className='text-muted-foreground text-xs' />
          </Identity>

          {/* Advanced sections from OnchainKit */}
          <WalletAdvancedWalletActions />
          <WalletAdvancedAddressDetails />
          <WalletAdvancedTransactionActions />
          <WalletAdvancedTokenHoldings />

          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  )
}