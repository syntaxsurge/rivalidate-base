'use client'

import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import ChatWindow from '@/components/agent/chat-window'

/**
 * Full-page AI Agent chat view with wallet-connection guard.
 */
export default function AgentChatPage() {
  const { isConnected } = useAccount()
  const router = useRouter()

  useEffect(() => {
    if (!isConnected) {
      toast.error('Connect your wallet to use the AI Agent.')
      router.push('/connect-wallet')
    }
  }, [isConnected, router])

  if (!isConnected) return null

  return (
    <section className='mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-4 py-8'>
      <ChatWindow mode='page' />
    </section>
  )
}