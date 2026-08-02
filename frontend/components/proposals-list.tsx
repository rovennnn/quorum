"use client";

import { useReadContract } from "wagmi";
import { QUORUM_ADDRESS } from "@/lib/wagmi";
import { QUORUM_ABI } from "@/lib/abi";
import { Proposal, effectiveState } from "@/lib/types";
import { ProposalCard } from "@/components/proposal-card";

type RawProposal = {
  id: bigint;
  proposer: `0x${string}`;
  title: string;
  description: string;
  deadline: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  resolved: boolean;
  state: number;
};

export function ProposalsList() {
  const { data, isLoading, isError } = useReadContract({
    address: QUORUM_ADDRESS,
    abi: QUORUM_ABI,
    functionName: "getAllProposals",
    query: { refetchInterval: 15_000 },
  });

  if (!QUORUM_ADDRESS) {
    return (
      <div className="border border-active/40 bg-active-bg px-5 py-4 font-mono text-sm text-active">
        Contract not configured. Deploy the contracts and add addresses to{" "}
        <code>.env.local</code>.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse bg-ink/5 dark:bg-[#EDE9E0]/5"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="font-mono text-sm text-no-color">
        Failed to load proposals. Check your RPC URL and contract address.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="font-body text-sm text-ink/50 dark:text-[#EDE9E0]/50">
        No proposals yet. Be the first to{" "}
        <a href="/propose" className="underline">
          submit one
        </a>
        .
      </p>
    );
  }

  // Sort: Active first, then by id descending
  const proposals = [...(data as RawProposal[])].sort((a, b) => {
    const aState = effectiveState(a as Proposal);
    const bState = effectiveState(b as Proposal);
    if (aState === 0 && bState !== 0) return -1;
    if (bState === 0 && aState !== 0) return 1;
    return Number(b.id - a.id);
  });

  const active = proposals.filter((p) => effectiveState(p as Proposal) === 0);
  const closed = proposals.filter((p) => effectiveState(p as Proposal) !== 0);

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-ink/40 dark:text-[#EDE9E0]/40">
            Active · {active.length}
          </h2>
          <div className="space-y-3">
            {active.map((p) => (
              <ProposalCard key={String(p.id)} proposal={p as Proposal} />
            ))}
          </div>
        </section>
      )}
      {closed.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-ink/40 dark:text-[#EDE9E0]/40">
            Closed · {closed.length}
          </h2>
          <div className="space-y-3">
            {closed.map((p) => (
              <ProposalCard key={String(p.id)} proposal={p as Proposal} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
