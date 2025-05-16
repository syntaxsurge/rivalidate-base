'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bot,
} from 'lucide-react'
import { Avatar } from '@coinbase/onchainkit/identity'

import { cn } from '@/lib/utils'
import { messageAgent as sendToBackend } from '@/app/hooks/useAgent'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Sender = 'user' | 'agent'
type ChatMessage = { id: string; text: string; sender: Sender }
type ChatSession = { id: string; title: string; messages: ChatMessage[] }

export interface ChatWindowProps {
  /** overlay = floating widget   |   page = full-page component */
  mode?: 'overlay' | 'page'
}

/* -------------------------------------------------------------------------- */
/*                             LOCAL-STORAGE HELPERS                          */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = 'rv_agent_chats'

function loadChats(): ChatSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? (data as ChatSession[]) : []
  } catch {
    return []
  }
}

function saveChats(chats: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  } catch {
    /* ignore quota errors */
  }
}

/* -------------------------------------------------------------------------- */
/*                                 AVATARS                                    */
/* -------------------------------------------------------------------------- */

function AgentAvatar() {
  return (
    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
      <Bot className='h-5 w-5 text-primary' />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

export default function ChatWindow({ mode = 'overlay' }: ChatWindowProps) {
  /* ----------------------------- state ---------------------------------- */
  const [collapsed, setCollapsed] = useState(false)
  const [chats, setChats] = useState<ChatSession[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  /* --------------------------- helpers ---------------------------------- */
  const currentChat = chats.find((c) => c.id === currentId) ?? null

  /** persist helper using functional update to avoid stale closures */
  const updateChats = (updater: (prev: ChatSession[]) => ChatSession[]) => {
    setChats((prev) => {
      const next = updater(prev)
      saveChats(next)
      return next
    })
  }

  /* -------------------------- CRUD chats -------------------------------- */
  function createChat() {
    const id = crypto.randomUUID()
    updateChats((prev) => [...prev, { id, title: `Chat ${prev.length + 1}`, messages: [] }])
    setCurrentId(id)
  }

  function deleteChat(id: string) {
    updateChats((prev) => prev.filter((c) => c.id !== id))
    setCurrentId((prev) => (prev === id ? chats.filter((c) => c.id !== id)[0]?.id ?? null : prev))
  }

  function appendMessage(msg: ChatMessage) {
    updateChats((prev) =>
      prev.map((c) =>
        c.id === currentId ? { ...c, messages: [...c.messages, msg] } : c,
      ),
    )
  }

  /* -------------------------- lifecycle --------------------------------- */
  useEffect(() => {
    const initial = loadChats()
    if (initial.length === 0) {
      const id = crypto.randomUUID()
      initial.push({ id, title: 'Chat 1', messages: [] })
    }
    setChats(initial)
    setCurrentId(initial[0].id)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat?.messages.length, isThinking])

  /* --------------------------- actions ---------------------------------- */
  async function handleSend() {
    if (!currentChat || !input.trim() || isThinking) return
    const userText = input.trim()
    setInput('')
    const userMsg: ChatMessage = { id: crypto.randomUUID(), text: userText, sender: 'user' }
    appendMessage(userMsg)

    setIsThinking(true)
    const reply = await sendToBackend(userText)
    const agentMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text: reply ?? 'Sorry, something went wrong.',
      sender: 'agent',
    }
    appendMessage(agentMsg)
    setIsThinking(false)
  }

  /* --------------------------- styling ---------------------------------- */
  const isOverlay = mode === 'overlay'
  const containerCls = cn(
    'flex flex-col rounded-lg border bg-background shadow-lg',
    isOverlay
      ? collapsed
        ? 'fixed bottom-24 right-6 z-50 h-14 w-80'
        : 'fixed bottom-24 right-6 z-50 h-[540px] w-96'
      : collapsed
      ? 'h-14 w-full'
      : 'w-full',
  )

  /* --------------------------- render ----------------------------------- */
  return (
    <div className={containerCls}>
      {/* Header ---------------------------------------------------------------- */}
      <div className='flex items-center justify-between border-b px-4 py-2'>
        {/* chat heads */}
        <div className='flex items-center -space-x-2'>
          <Avatar className='h-8 w-8 border-2 border-background shadow' />
          <AgentAvatar />
        </div>

        {/* chat selector */}
        <div className='relative ml-3'>
          <select
            value={currentId ?? ''}
            onChange={(e) => setCurrentId(e.target.value)}
            className='appearance-none rounded-md bg-muted px-3 py-1 pr-8 text-sm font-medium'
          >
            {chats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <ChevronDown className='pointer-events-none absolute right-2 top-2 h-4 w-4 text-muted-foreground' />
        </div>

        {/* controls */}
        <div className='ml-auto flex items-center gap-1'>
          <button
            type='button'
            aria-label='New chat'
            onClick={createChat}
            className='hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md'
          >
            <Plus className='h-4 w-4' />
          </button>
          {currentId && (
            <button
              type='button'
              aria-label='Delete chat'
              onClick={() => deleteChat(currentId)}
              className='hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          )}
          <button
            type='button'
            aria-label='Collapse'
            onClick={() => setCollapsed((c) => !c)}
            className='hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md'
          >
            {collapsed ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
          </button>
        </div>
      </div>

      {/* Body ------------------------------------------------------------------ */}
      {!collapsed && (
        <>
          {/* messages */}
          <div className='flex flex-grow flex-col gap-4 overflow-y-auto px-4 py-3'>
            {currentChat?.messages.length === 0 && (
              <p className='text-center text-sm text-muted-foreground'>
                Start chatting with the on-chain AI&nbsp;Agent…
              </p>
            )}

            {currentChat?.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex items-end gap-2',
                  m.sender === 'user' && 'flex-row-reverse',
                )}
              >
                {m.sender === 'user' ? <Avatar className='h-8 w-8 shrink-0' /> : <AgentAvatar />}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow',
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  <ReactMarkdown
                    components={{
                      a: (props) => (
                        <a
                          {...props}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='underline underline-offset-2'
                        />
                      ),
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <AgentAvatar />
                <span className='flex items-center gap-1 italic'>
                  <Loader2 className='h-4 w-4 animate-spin' /> thinking…
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* input */}
          <div className='border-t flex items-center gap-2 px-3 py-2'>
            <input
              type='text'
              placeholder='Type a message…'
              className='flex-grow rounded-full border px-4 py-2 text-sm'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isThinking}
            />
            <button
              onClick={handleSend}
              disabled={isThinking}
              className='rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-opacity disabled:opacity-50'
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}