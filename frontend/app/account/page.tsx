"use client";

import { useAccount, useReadContract } from "wagmi";
import { Nav } from "@/components/nav";
import { TOKEN_ADDRESS, QUORUM_ADDRESS } from "@/lib/wagmi";
import { TOKEN_ABI, QUORUM_ABI } from "@/lib/abi";
import { formatVotes, shortenAddress, STATE_LABEL, effectiveState, Proposal } from "@/lib/types";

export default function AccountPage() {
  const { address, isConnected } = useAccount();

  const { data: balance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  const { data: totalSupply } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: "totalSupply",
    query: { enabled: !!TOKEN_ADDRESS },
  });

  const { data: votedIds } = useReadContract({
    address: QUORUM_ADDRESS,
    abi: QUORUM_ABI,
    functionName: "getVotedOn",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  const { data: allProposals } = useReadContract({
    address: QUORUM_ADDRESS,
    abi: QUORUM_ABI,
    functionName: "getAllProposals",
    query: { enabled: !!QUORUM_ADDRESS },
  });

  // wagmi infers correct bigint types from the typed ABI
  const bal = balance;
  const supply = totalSupply;
  const influence =
    bal != null && supply != null && supply > 0n
      ? Number((bal * 10000n) / supply) / 100
      : 0;

  if (!isConnected) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="font-display text-3xl font-bold text-ink dark:text-[#EDE9E0]">
            My Tokens
          </h1>
          <p className="mt-4 font-mono text-sm text-ink/50 dark:text-[#EDE9E0]/50">
            Connect your wallet to view your token balance.
          </p>
        </main>
      </>
    );
  }

  const votedList = votedIds as readonly bigint[] | undefined;
  const proposalList = allProposals as readonly Proposal[] | undefined;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-ink dark:text-[#EDE9E0]">
          My Tokens
        </h1>
        <p className="mt-1 font-mono text-xs text-ink/40 dark:text-[#EDE9E0]/40">
          {shortenAddress(address!)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="border border-ink/10 dark:border-[#EDE9E0]/10 bg-white dark:bg-[#252119] px-4 py-4">
            <p className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-[#EDE9E0]/40">
              Balance
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-ink dark:text-[#EDE9E0]">
              {bal != null ? formatVotes(bal) : "0"}
            </p>
            <p className="font-mono text-xs text-ink/40 dark:text-[#EDE9E0]/40">QRM</p>
          </div>

          <div className="border border-ink/10 dark:border-[#EDE9E0]/10 bg-white dark:bg-[#252119] px-4 py-4">
            <p className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-[#EDE9E0]/40">
              Vote weight
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-ink dark:text-[#EDE9E0]">
              {influence}%
            </p>
            <p className="font-mono text-xs text-ink/40 dark:text-[#EDE9E0]/40">
              of total supply
            </p>
          </div>

          <div className="border border-ink/10 dark:border-[#EDE9E0]/10 bg-white dark:bg-[#252119] px-4 py-4">
            <p className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-[#EDE9E0]/40">
              Votes cast
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-ink dark:text-[#EDE9E0]">
              {votedList ? votedList.length : 0}
            </p>
            <p className="font-mono text-xs text-ink/40 dark:text-[#EDE9E0]/40">
              proposals
            </p>
          </div>
        </div>

        {votedList && votedList.length > 0 && proposalList && (
          <div className="mt-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink/40 dark:text-[#EDE9E0]/40 mb-4">
              Voting history
            </h2>
            <div className="space-y-2">
              {votedList.map((pid) => {
                const found = proposalList.find((p) => p.id === pid);
                if (!found) return null;
                const state = effectiveState(found);
                return (
                  <a
                    key={String(pid)}
                    href={`/proposals/${pid}`}
                    className="flex items-center justify-between border border-ink/8 dark:border-[#EDE9E0]/8 px-4 py-3 hover:border-ink/20 dark:hover:border-[#EDE9E0]/20 transition-colors"
                  >
                    <span className="font-body text-sm text-ink dark:text-[#EDE9E0] truncate">
                      {found.title}
                    </span>
                    <span className="ml-4 shrink-0 font-mono text-xs text-ink/50 dark:text-[#EDE9E0]/50">
                      {STATE_LABEL[state]}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-ink/10 dark:border-[#EDE9E0]/10 pt-6 font-mono text-xs text-ink/35 dark:text-[#EDE9E0]/35">
          Quorum tokens are non-transferable. They represent governance
          membership, not monetary value.
        </div>
      </main>
    </>
  );
}
