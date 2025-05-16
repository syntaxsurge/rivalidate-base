import {
  AgentKit,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  CdpWalletProvider,
  erc20ActionProvider,
  pythActionProvider,
  walletActionProvider,
  wethActionProvider,
  WalletProvider,
} from "@coinbase/agentkit";
import { uniswapv2ActionProvider } from "./uniswapV2ActionProvider";
import { getEnv } from "@/lib/utils/env";
import * as fs from "fs";
import * as path from "path";

const WALLET_DATA_FILE = ".data/agentkit_wallet.json";

/**
 * Ensure the .data directory exists so the wallet file can be persisted.
 */
const walletDir = path.dirname(WALLET_DATA_FILE);
if (!fs.existsSync(walletDir)) {
  fs.mkdirSync(walletDir, { recursive: true });
}

export async function prepareAgentkitAndWalletProvider(): Promise<{
  agentkit: AgentKit;
  walletProvider: WalletProvider;
}> {
  try {
    const apiKeyName = getEnv("CDP_API_KEY_NAME") as string;
    const apiKeyPrivateKey = getEnv("CDP_API_KEY_PRIVATE_KEY") as string;
    const networkId = (getEnv("NETWORK_ID", { optional: true }) as string) ?? "base-sepolia";

    let walletDataStr: string | null = null;
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (err) {
        console.error("Failed reading wallet data:", err);
      }
    }

    const walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyName,
      apiKeyPrivateKey,
      networkId,
      cdpWalletData: walletDataStr ?? undefined,
    });

    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({ apiKeyName, apiKeyPrivateKey }),
        cdpWalletActionProvider({ apiKeyName, apiKeyPrivateKey }),
        uniswapv2ActionProvider(),
      ],
    });

    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agentkit, walletProvider };
  } catch (err) {
    console.error("prepare-agentkit error:", err);
    throw new Error("Failed to initialise AgentKit");
  }
}