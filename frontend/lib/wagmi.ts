import { http, createConfig } from "wagmi";
import { sepolia, hardhat } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const sepoliaRpc = process.env.NEXT_PUBLIC_RPC_URL || "";

export const wagmiConfig = createConfig({
  chains: [sepolia, hardhat],
  connectors: [
    injected(),
    // WalletConnect — add your projectId from https://cloud.walletconnect.com
    // walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID! }),
  ],
  transports: {
    [sepolia.id]: http(sepoliaRpc),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);
export const QUORUM_ADDRESS = (process.env.NEXT_PUBLIC_QUORUM_ADDRESS ?? "") as `0x${string}`;
export const TOKEN_ADDRESS  = (process.env.NEXT_PUBLIC_TOKEN_ADDRESS  ?? "") as `0x${string}`;
