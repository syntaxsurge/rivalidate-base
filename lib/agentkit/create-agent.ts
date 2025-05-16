import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { prepareAgentkitAndWalletProvider } from "@/lib/agentkit/prepare-agentkit";

let agent: ReturnType<typeof createReactAgent>;

/**
 * Initialise (or return existing) React-style AgentKit agent.
 */
export async function createAgent(): Promise<ReturnType<typeof createReactAgent>> {
  if (agent) return agent;

  const { agentkit, walletProvider } = await prepareAgentkitAndWalletProvider();

  // Lower temperature for deterministic outputs during hackathon demos.
  const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.2 });

  const tools = await getLangChainTools(agentkit);
  const memory = new MemorySaver();

  const canUseFaucet = walletProvider.getNetwork().networkId === "base-sepolia";
  const faucetMsg = canUseFaucet
    ? "If you need funds, request them from the faucet."
    : "If you need funds, provide the wallet address and ask the user.";

  agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier: `
      You are a helpful on-chain assistant powered by Coinbase AgentKit.
      ${faucetMsg}
      Always retrieve wallet details before the first action.
      If a 5xx error occurs, politely ask the user to retry later.
      Be concise; if a requested capability is unavailable, explain and
      direct the user to docs.cdp.coinbase.com.
    `,
  });

  return agent;
}