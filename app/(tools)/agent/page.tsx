'use client'

import { useState, useEffect, useRef } from 'react'
import { useAgent } from '@/app/hooks/useAgent'
import ReactMarkdown from 'react-markdown'

export default function AgentChatPage() {
  const { messages, sendMessage, isThinking } = useAgent()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  /* Auto-scroll on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const onSend = async () => {
    if (!input.trim() || isThinking) return
    const msg = input
    setInput('')
    await sendMessage(msg)
  }

  return (
    <section className='mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col px-4 py-8'>
      {/* Chat container */}
      <div className='flex-grow overflow-y-auto rounded-lg border bg-background p-4 shadow-sm'>
        {messages.length === 0 && (
          <p className='text-muted-foreground text-center'>Start chatting with the on-chain AI&nbsp;Agent…</p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-3 max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-2 shadow ${
              m.sender === 'user'
                ? 'ml-auto bg-primary text-primary-foreground'
                : 'mr-auto bg-muted'
            }`}
          >
            <ReactMarkdown
              components={{
                a: props => (
                  <a
                    {...props}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary underline'
                  />
                ),
              }}
            >
              {m.text}
            </ReactMarkdown>
          </div>
        ))}

        {isThinking && <p className='text-muted-foreground italic'>🤖 thinking…</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className='mt-4 flex gap-2'>
        <input
          type='text'
          className='flex-grow rounded-md border px-3 py-2'
          placeholder='Type a message…'
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSend()}
          disabled={isThinking}
        />
        <button
          onClick={onSend}
          disabled={isThinking}
          className='rounded-md bg-primary px-5 py-2 text-primary-foreground shadow transition-opacity disabled:opacity-50'
        >
          Send
        </button>
      </div>
    </section>
  )
}