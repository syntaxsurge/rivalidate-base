import { NextResponse } from 'next/server'

import { type AgentRequest, type AgentResponse } from '@/lib/types/agent'

import { createAgent } from './create-agent'

/**
 * POST /api/agent — proxy a single user message to the AgentKit agent.
 */
export async function POST(
  req: Request & { json: () => Promise<AgentRequest> },
): Promise<NextResponse<AgentResponse>> {
  try {
    /* 1. Extract the user message */
    const { userMessage } = await req.json()

    /* 2. Initialise or reuse the agent instance */
    const agent = await createAgent()

    /* 3. Stream the agent’s response */
    const stream = await agent.stream(
      { messages: [{ role: 'user', content: userMessage }] },
      { configurable: { thread_id: 'AgentKit Discussion' } },
    )

    /* 4. Accumulate streamed chunks */
    let agentResponse = ''
    for await (const chunk of stream) {
      if ('agent' in chunk) {
        agentResponse += chunk.agent.messages[0].content
      }
    }

    /* 5. Return final message */
    return NextResponse.json({ response: agentResponse })
  } catch (err) {
    console.error('Agent route error:', err)
    return NextResponse.json({ error: 'Failed to process message' })
  }
}
