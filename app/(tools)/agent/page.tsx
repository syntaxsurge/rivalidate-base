'use client'

import ChatWindow from '@/components/agent/chat-window'

/**
 * Full-page AI Agent chat view reusing the centralised ChatWindow component.
 */
export default function AgentChatPage() {
  return (
    <section className='mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-4 py-8'>
      <ChatWindow mode='page' />
    </section>
  )
}