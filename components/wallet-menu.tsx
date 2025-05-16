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

/**
 * WalletMenu — reusable Smart Wallet connect button with full dropdown.
 * Use anywhere a connect / account menu is required.
 */
export default function WalletMenu() {
  return (
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

        <WalletAdvancedWalletActions />
        <WalletAdvancedAddressDetails />
        <WalletAdvancedTransactionActions />
        <WalletAdvancedTokenHoldings />

        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  )
}