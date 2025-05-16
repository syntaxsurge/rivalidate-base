'use client'

import { useState } from 'react'
import type { AgentRequest, AgentResponse } from '@/lib/types/agent'

/**
 * Send a user message to the backend /api/agent endpoint and
 * return either the agent’s reply or an error string.
 */
async function messageAgent(userMessage: string): Promise<string | null> {
  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage } as AgentRequest),
    })

    const data = (await res.json()) as AgentResponse
    return data.response ?? data.error ?? null
  } catch (err) {
    console.error('Agent request failed:', err)
    return null
  }
}

/**
 * useAgent — simple local-state chat helper.
 * Returns the conversation array, a sendMessage() helper and isThinking flag.
 */
export function useAgent() {
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'agent' }[]>([])
  const [isThinking, setIsThinking] = useState(false)

  const sendMessage = async (input: string) => {
    if (!input.trim()) return
    setMessages(prev => [...prev, { text: input, sender: 'user' }])
    setIsThinking(true)

    const reply = await messageAgent(input)
    if (reply) {
      setMessages(prev => [...prev, { text: reply, sender: 'agent' }])
    }
    setIsThinking(false)
  }

  return { messages, sendMessage, isThinking }
}