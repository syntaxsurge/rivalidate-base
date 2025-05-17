import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/session'
import type { AgentRequest, AgentResponse } from '@/lib/types/agent'

import { createAgent, getAgentWalletAddress } from './create-agent'

/* -------------------------------------------------------------------------- */
/*                          A G E N T   P R O X Y                             */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/agent — forward a single user message to the AgentKit agent
 * while injecting the connected wallet (when present) as a system hint.
 */
export async function POST(
  req: Request & { json: () => Promise<AgentRequest> },
): Promise<NextResponse<AgentResponse>> {
  try {
    /* --------------------------- Payload -------------------------------- */
    const { userMessage } = await req.json()

    /* -------------------------- Wallet info ----------------------------- */
    let walletAddress: string | null = null
    const cookieHeader = req.headers.get('cookie') || ''
    const sessionPair = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('session='))

    if (sessionPair) {
      const sessionValue = decodeURIComponent(sessionPair.slice('session='.length))
      try {
        const payload = await verifyToken(sessionValue)
        walletAddress = payload.wallet ?? null
      } catch {
        /* Expired or malformed session — ignore. */
      }
    }

    const systemContext = walletAddress
      ? `The connected user's wallet address is ${walletAddress}.`
      : `The user is not connected; you do not have their wallet address.`

    /* Agent self-identification context */
    const agentWalletAddress = await getAgentWalletAddress().catch(() => null)
    const agentContext = agentWalletAddress
      ? ` Your own agent wallet address is ${agentWalletAddress}.`
      : 'You are currently unable to retrieve your own wallet address.'

    /* --------------------------- Agent ---------------------------------- */
    const agent = await createAgent()

    const stream = await agent.stream(
      {
        messages: [
          { role: 'system', content: systemContext + agentContext },
          { role: 'user', content: userMessage },
        ],
      },
      { configurable: { thread_id: 'AgentKit Discussion' } },
    )

    /* ---------------------- Collect response ---------------------------- */
    let agentResponse = ''
    for await (const chunk of stream) {
      if ('agent' in chunk) {
        agentResponse += chunk.agent.messages[0].content
      }
    }

    /* Normalise whitespace */
    const cleaned = agentResponse
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim()

    return NextResponse.json({ response: cleaned })
  } catch (err) {
    console.error('Agent route error:', err)
    return NextResponse.json({ error: 'Failed to process message' })
  }
}
