'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { messageAgent as sendToBackend } from '@/app/hooks/useAgent'

/* -------------------------------------------------------------------------- */
/*                                 T Y P E S                                  */
/* -------------------------------------------------------------------------- */

type Sender = 'user' | 'agent'
type ChatMessage = { text: string; sender: Sender }
type ChatSession = { id: string; title: string; messages: ChatMessage[] }

export interface ChatWindowProps {
  /** Overlay = floating panel (widget); page = full-page view */
  mode?: 'overlay' | 'page'
}

/* -------------------------------------------------------------------------- */
/*                            L O C A L S T O R A G E                         */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = 'rv_agent_chats'

function loadChats(): ChatSession[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ChatSession[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveChats(chats: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  } catch {
    /* Ignore quota errors */
  }
}

/* -------------------------------------------------------------------------- */
/*                               C O M P O N E N T                            */
/* -------------------------------------------------------------------------- */

export default function ChatWindow({ mode = 'overlay' }: ChatWindowProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [chats, setChats] = useState<ChatSession[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  /* ------------------------ helpers ------------------------------------ */
  const currentChat = chats.find((c) => c.id === currentId) || null

  function persist(next: ChatSession[]) {
    setChats(next)
    saveChats(next)
  }

  function createChat() {
    const id = crypto.randomUUID()
    const newChat: ChatSession = { id, title: `Chat ${chats.length + 1}`, messages: [] }
    const next = [...chats, newChat]
    persist(next)
    setCurrentId(id)
  }

  function deleteChat(id: string) {
    const next = chats.filter((c) => c.id !== id)
    persist(next)
    if (currentId === id) setCurrentId(next[0]?.id ?? null)
  }

  function appendMessage(chatId: string, msg: ChatMessage) {
    const next = chats.map((c) =>
      c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c,
    )
    persist(next)
  }

  /* ------------------------ lifecycle ---------------------------------- */
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
  }, [currentChat?.messages.length])

  /* ------------------------ actions ------------------------------------ */
  async function handleSend() {
    if (!currentChat || !input.trim() || isThinking) return
    const userMsg = input
    setInput('')
    appendMessage(currentChat.id, { text: userMsg, sender: 'user' })
    setIsThinking(true)

    const reply = await sendToBackend(userMsg)
    if (reply) {
      appendMessage(currentChat.id, { text: reply, sender: 'agent' })
    }
    setIsThinking(false)
  }

  /* ------------------------ layout variants ---------------------------- */
  const isOverlay = mode === 'overlay'
  const containerCls = isOverlay
    ? cn(
        'fixed bottom-24 right-6 z-50 flex flex-col rounded-xl border bg-background shadow-lg transition-all',
        collapsed ? 'h-16 w-80' : 'h-[500px] w-96',
      )
    : cn(
        'flex flex-col rounded-lg border bg-background shadow-sm w-full',
        collapsed && 'h-16',
      )

  /* ------------------------ render ------------------------------------- */
  return (
    <div className={containerCls}>
      {/* Header */}
      <div className='border-b flex items-center justify-between px-4 py-2'>
        {/* Chat selector */}
        <div className='relative'>
          <select
            value={currentId ?? ''}
            onChange={(e) => setCurrentId(e.target.value)}
            className='pr-8 text-sm font-medium outline-none bg-transparent'
          >
            {chats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <ChevronDown className='pointer-events-none absolute right-0 top-1.5 h-4 w-4 text-muted-foreground' />
        </div>

        <div className='flex items-center gap-2'>
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

      {/* Body */}
      {!collapsed && (
        <>
          <div className='flex-grow overflow-y-auto p-4'>
            {currentChat?.messages.length === 0 && (
              <p className='text-muted-foreground text-center text-sm'>
                Start chatting with the on-chain AI&nbsp;Agent…
              </p>
            )}

            {currentChat?.messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'mb-3 max-w-[85%] rounded-2xl px-4 py-2 shadow',
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted mr-auto',
                )}
              >
                <ReactMarkdown
                  components={{
                    a: (props) => (
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

            {isThinking && (
              <p className='text-muted-foreground italic'>
                <Loader2 className='mr-1 inline h-4 w-4 animate-spin' />
                thinking…
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className='border-t flex items-center gap-2 p-3'>
            <input
              type='text'
              className='flex-grow rounded-md border px-3 py-2 text-sm'
              placeholder='Type a message…'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isThinking}
            />
            <button
              onClick={handleSend}
              disabled={isThinking}
              className='bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm shadow transition-opacity disabled:opacity-50'
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}