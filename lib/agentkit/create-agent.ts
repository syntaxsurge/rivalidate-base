import { getLangChainTools } from '@coinbase/agentkit-langchain'
import { MemorySaver } from '@langchain/langgraph'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { ChatOpenAI } from '@langchain/openai'

import { prepareAgentkitAndWalletProvider } from '@/lib/agentkit/prepare-agentkit'

let agent: ReturnType<typeof createReactAgent>

/**
 * Initialise (or return existing) React-style AgentKit agent.
 */
export async function createAgent(): Promise<ReturnType<typeof createReactAgent>> {
  if (agent) return agent

  const { agentkit, walletProvider } = await prepareAgentkitAndWalletProvider()

  /* Use the same LLM & settings as the AgentKit-Sample template */
  const llm = new ChatOpenAI({ model: 'gpt-4o-mini' })

  const tools = await getLangChainTools(agentkit)
  const memory = new MemorySaver()

  const canUseFaucet = walletProvider.getNetwork().networkId === 'base-sepolia'
  const faucetMsg = canUseFaucet
    ? 'If you ever need funds, you can request them from the faucet.'
    : 'If you need funds, you can provide your wallet details and request funds from the user.'

  agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier: `
        You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are 
        empowered to interact onchain using your tools. ${faucetMsg}
        Before executing your first action, get the wallet details to see what network 
        you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone 
        asks you to do something you can't do with your currently available tools, you must say so, and 
        encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to 
        docs.cdp.coinbase.com for more information. Be concise and helpful with your responses. Refrain from 
        restating your tools' descriptions unless it is explicitly requested.

        You can use the uniswap-v2-action to swap ETH to USDC on the Uniswap V2 protocol.
    `,
  })

  return agent
}
