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
  User,
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { messageAgent as sendToBackend } from '@/app/hooks/useAgent'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Sender = 'user' | 'agent'
type ChatMessage = { id: string; text: string; sender: Sender }
type ChatSession = { id: string; title: string; messages: ChatMessage[] }

export interface ChatWindowProps {
  /** overlay = floating widget | page = full-page component */
  mode?: 'overlay' | 'page'
}

/* -------------------------------------------------------------------------- */
/*                           L O C A L   S T O R A G E                        */
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
    /* quota errors → ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*                                   AVATARS                                  */
/* -------------------------------------------------------------------------- */

function AgentAvatar() {
  return (
    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
      <Bot className='h-5 w-5 text-primary' />
    </div>
  )
}

function UserChatAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground',
        className,
      )}
    >
      <User className='h-5 w-5' />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function ChatWindow({ mode = 'overlay' }: ChatWindowProps) {
  /* ----------------------------- STATE ---------------------------------- */
  const { isConnected } = useAccount()
  const [chats, setChats] = useState<ChatSession[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  /* ----------------------- PERSISTENCE HELPER --------------------------- */
  const updateChats = (updater: (prev: ChatSession[]) => ChatSession[]) => {
    setChats(prev => {
      const next = updater(prev)
      saveChats(next)
      return next
    })
  }

  /* --------------------------- INIT LOAD ------------------------------- */
  useEffect(() => {
    const initial = loadChats()
    if (initial.length === 0) {
      const id = crypto.randomUUID()
      initial.push({ id, title: 'Chat 1', messages: [] })
    }
    setChats(initial)
    setCurrentId(initial[0].id)
  }, [])

  /* ------------------------ SCROLL BOTTOM ------------------------------ */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentId, chats, isThinking])

  const currentChat = chats.find(c => c.id === currentId) ?? null

  /* ------------------------- CHAT CRUD --------------------------------- */
  function createChat() {
    updateChats(prev => {
      const id = crypto.randomUUID()
      const title = `Chat ${prev.length + 1}`
      setCurrentId(id)
      return [...prev, { id, title, messages: [] }]
    })
  }

  function deleteChat(id: string) {
    updateChats(prev => {
      const remaining = prev.filter(c => c.id !== id)

      /* If nothing left, create a fresh Chat 1 automatically */
      if (remaining.length === 0) {
        const newId = crypto.randomUUID()
        const newChat: ChatSession = { id: newId, title: 'Chat 1', messages: [] }
        setCurrentId(newId)
        return [newChat]
      }

      /* Otherwise, select first remaining chat if current was deleted */
      if (currentId === id) setCurrentId(remaining[0].id)
      return remaining
    })
  }

  function appendMessage(msg: ChatMessage) {
    updateChats(prev =>
      prev.map(c => (c.id === currentId ? { ...c, messages: [...c.messages, msg] } : c)),
    )
  }

  /* --------------------------- SEND MSG --------------------------------- */
  async function handleSend() {
    if (!currentChat || !input.trim() || isThinking) return
    if (!isConnected) {
      toast.error('Connect your wallet to use the AI Agent.')
      return
    }

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

  /* --------------------------- RENDER ---------------------------------- */
  const isOverlay = mode === 'overlay'

  const overlayExpanded = [
    'fixed bottom-24 right-6 z-50',
    'w-[calc(100vw-3rem)] h-[calc(100dvh-8rem)]',
    'sm:w-96 sm:h-[540px]',
  ].join(' ')

  const overlayCollapsed = [
    'fixed bottom-24 right-6 z-50 h-14',
    'w-[calc(100vw-3rem)]',
    'sm:w-80',
  ].join(' ')

  const containerCls = cn(
    'flex flex-col rounded-lg border bg-background shadow-lg',
    isOverlay
      ? collapsed
        ? overlayCollapsed
        : overlayExpanded
      : collapsed
        ? 'h-14 w-full'
        : 'h-full w-full',
  )

  return (
    <div className={containerCls}>
      {/* ------------------------- HEADER ------------------------- */}
      <div className='flex items-center justify-between border-b px-4 py-2'>
        <div className='flex -space-x-2 items-center'>
          <UserChatAvatar className='h-8 w-8 border-2 border-background shadow' />
          <AgentAvatar />
        </div>

        <div className='relative ml-3'>
          <select
            value={currentId ?? ''}
            onChange={e => setCurrentId(e.target.value)}
            className='appearance-none rounded-md bg-muted px-3 py-1 pr-8 text-sm font-medium'
          >
            {chats.map(c => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <ChevronDown className='pointer-events-none absolute right-2 top-2 h-4 w-4 text-muted-foreground' />
        </div>

        <div className='ml-auto flex items-center gap-1'>
          <button
            aria-label='New chat'
            onClick={createChat}
            className='hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md'
            type='button'
          >
            <Plus className='h-4 w-4' />
          </button>

          {currentId && (
            <button
              aria-label='Delete chat'
              onClick={() => deleteChat(currentId)}
              className='hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md'
              type='button'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          )}

          <button
            aria-label='Collapse'
            onClick={() => setCollapsed(c => !c)}
            className='hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md'
            type='button'
          >
            {collapsed ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
          </button>
        </div>
      </div>

      {/* ------------------------- BODY -------------------------- */}
      {!collapsed && (
        <>
          <div className='flex flex-grow flex-col gap-4 overflow-y-auto overflow-x-hidden px-4 py-3'>
            {currentChat?.messages.length === 0 && (
              <p className='text-center text-sm text-muted-foreground'>
                Start chatting with the on-chain AI&nbsp;Agent…
              </p>
            )}

            {currentChat?.messages.map(m => (
              <div
                key={m.id}
                className={cn(
                  'flex items-end gap-2',
                  m.sender === 'user' && 'flex-row-reverse',
                )}
              >
                {m.sender === 'user' ? (
                  <UserChatAvatar className='h-8 w-8 shrink-0' />
                ) : (
                  <AgentAvatar />
                )}

                <div
                  className={cn(
                    'max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm shadow',
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  <ReactMarkdown
                    components={{
                      a: props => (
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

          <div className='border-t flex items-center gap-2 px-3 py-2'>
            <input
              type='text'
              placeholder='Type a message…'
              className='flex-grow rounded-full border px-4 py-2 text-sm'
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={isThinking}
            />
            <button
              onClick={handleSend}
              disabled={isThinking}
              className='rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-opacity disabled:opacity-50'
              type='button'
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}