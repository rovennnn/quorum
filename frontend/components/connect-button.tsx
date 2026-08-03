"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { TOKEN_ADDRESS } from "@/lib/wagmi";
import { shortenAddress } from "@/lib/types";

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showModal, setShowModal] = useState(false);

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

  const CONNECTOR_LABELS: Record<string, string> = {
    injected: "Browser Wallet",
    metaMask: "MetaMask",
    walletConnect: "WalletConnect",
    coinbaseWallet: "Coinbase Wallet",
    safe: "Safe",
  };

  const CONNECTOR_DESC: Record<string, string> = {
    injected: "Connect using your browser extension",
    metaMask: "Connect using MetaMask",
    walletConnect: "Trust Wallet, Rainbow, and 300+ wallets",
    coinbaseWallet: "Connect using Coinbase Wallet",
    safe: "Connect using Safe multisig",
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="border border-ink/30 dark:border-[#EDE9E0]/30 px-3 py-1.5 font-mono text-xs hover:border-ink dark:hover:border-[#EDE9E0] transition-colors"
      >
        connect wallet
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 dark:bg-ink/60 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm bg-parchment dark:bg-[#1C1917] border border-ink/15 dark:border-[#EDE9E0]/15 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-ink dark:text-[#EDE9E0]">
                Connect wallet
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="font-mono text-xs text-ink/40 dark:text-[#EDE9E0]/40 hover:text-ink dark:hover:text-[#EDE9E0]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowModal(false);
                  }}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 border border-ink/10 dark:border-[#EDE9E0]/10 bg-white dark:bg-[#252119] px-4 py-3 text-left hover:border-ink/30 dark:hover:border-[#EDE9E0]/30 transition-colors disabled:opacity-50"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-ink dark:text-[#EDE9E0]">
                      {CONNECTOR_LABELS[connector.id] ?? connector.name}
                    </p>
                    <p className="font-mono text-xs text-ink/45 dark:text-[#EDE9E0]/45">
                      {CONNECTOR_DESC[connector.id] ?? "Connect wallet"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-4 font-mono text-xs text-ink/35 dark:text-[#EDE9E0]/35">
              Need Sepolia testnet ETH?{" "}
              <a
                href="https://sepoliafaucet.com"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                sepoliafaucet.com
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
