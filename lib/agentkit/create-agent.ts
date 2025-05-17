import type { WalletProvider } from '@coinbase/agentkit'
import { getLangChainTools } from '@coinbase/agentkit-langchain'
import { MemorySaver } from '@langchain/langgraph'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'

import { prepareAgentkitAndWalletProvider } from '@/lib/agentkit/prepare-agentkit'

let agent: ReturnType<typeof createReactAgent> | null = null
let walletProviderRef: WalletProvider | null = null

/**
 * Initialise (or return existing) React-style AgentKit agent.
 */
export async function createAgent(): Promise<ReturnType<typeof createReactAgent>> {
  if (agent) return agent

  const { agentkit, walletProvider } = await prepareAgentkitAndWalletProvider()
  walletProviderRef = walletProvider

  /* --------------------------- L L M  &  T O O L S --------------------------- */
  const llm = new ChatOpenAI({ model: 'gpt-4o-mini' })
  const tools = await getLangChainTools(agentkit)
  const memory = new MemorySaver()

  /* --------------------------- Faucet prompt --------------------------- */
  const canUseFaucet = walletProvider.getNetwork().networkId === 'base-sepolia'
  const faucetMsg = canUseFaucet
    ? 'If you ever need funds, you can request them from the faucet.'
    : 'If you need funds, you can provide your wallet details and request funds from the user.'

  /* --------------------------- Agent instance --------------------------- */
  agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier: `
        You are a helpful agent that can interact on-chain using the Coinbase Developer Platform
        AgentKit. You are empowered to interact on-chain using your tools. ${faucetMsg}
        Before executing your first action, get the wallet details to see what network you're on.
        If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone
        asks you to do something you can't do with your currently available tools, you must say so,
        and encourage them to implement it themselves using the CDP SDK + AgentKit. Recommend they
        visit docs.cdp.coinbase.com. Be concise and helpful. Refrain from restating your tools'
        descriptions unless explicitly requested.

        You can use the uniswap-v2-action to swap ETH to USDC on the Uniswap V2 protocol.
    `,
  })

  return agent
}

/**
 * Retrieve the agent’s own wallet address (ensures the agent is initialised first).
 */
export async function getAgentWalletAddress(): Promise<string> {
  if (!walletProviderRef) {
    await createAgent()
  }
  if (!walletProviderRef) throw new Error('Wallet provider unavailable')
  return walletProviderRef.getAddress() as string
}
