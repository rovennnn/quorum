"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { TOKEN_ADDRESS } from "@/lib/wagmi";
import { shortenAddress } from "@/lib/types";

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: tokenBalance } = useBalance({
    address,
    token: TOKEN_ADDRESS || undefined,
    query: { enabled: isConnected && !!TOKEN_ADDRESS },
  });

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {tokenBalance && (
          <span className="font-mono text-xs text-ink/60 dark:text-[#EDE9E0]/60">
            {Number(tokenBalance.value / BigInt(1e18)).toLocaleString()} QRM
          </span>
        )}
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 border border-ink/20 dark:border-[#EDE9E0]/20 px-3 py-1.5 font-mono text-xs hover:border-no-color hover:text-no-color transition-colors"
          title={`Connected to ${chain?.name ?? "unknown network"}`}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-yes-color" />
          {shortenAddress(address)}
        </button>
      </div>
    );
  }

  const injectedConnector = connectors.find((c) => c.id === "injected");

  return (
    <button
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={isPending || !injectedConnector}
      className="border border-ink/30 dark:border-[#EDE9E0]/30 px-3 py-1.5 font-mono text-xs hover:border-ink dark:hover:border-[#EDE9E0] transition-colors disabled:opacity-50"
    >
      {isPending ? "connecting..." : "connect wallet"}
    </button>
  );
}
