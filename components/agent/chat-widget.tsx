'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

import ChatWindow from './chat-window'

/**
 * ChatWidget — floating chat bubble that toggles the shared ChatWindow overlay.
 * All chat state and UI live inside ChatWindow; this file only handles
 * the open/close toggle and positions the overlay.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating toggle button */}
      <button
        type='button'
        aria-label={open ? 'Close AI Agent' : 'Open AI Agent'}
        onClick={() => setOpen((o) => !o)}
        className='bg-primary text-primary-foreground fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none'
      >
        {open ? <X className='h-6 w-6' /> : <MessageCircle className='h-6 w-6' />}
      </button>

      {/* Overlay chat window */}
      {open && <ChatWindow mode='overlay' />}
    </>
  )
}