'use client'

import { useState } from 'react'

import { MessageCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'

import ChatWindow from './chat-window'

/**
 * ChatWidget — floating chat bubble that toggles the shared ChatWindow overlay.
 * Now gated so only connected wallets can open the AI Agent.
 */
export default function ChatWidget() {
  const { isConnected } = useAccount()
  const [open, setOpen] = useState(false)

  function handleToggle() {
    if (!isConnected) {
      toast.error('Connect your wallet to use the AI Agent.')
      return
    }
    setOpen((o) => !o)
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        type='button'
        aria-label={open ? 'Close AI Agent' : 'Open AI Agent'}
        onClick={handleToggle}
        className='bg-primary text-primary-foreground fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none'
      >
        {open ? <X className='h-6 w-6' /> : <MessageCircle className='h-6 w-6' />}
      </button>

      {/* Overlay chat window */}
      {open && <ChatWindow mode='overlay' />}
    </>
  )
}
