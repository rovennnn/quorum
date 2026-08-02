"use client";

import Link from "next/link";
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useParams } from "next/navigation";
import { QUORUM_ADDRESS } from "@/lib/wagmi";
import { QUORUM_ABI } from "@/lib/abi";
import { Nav } from "@/components/nav";
import {
  Proposal,
  effectiveState,
  yesPercent,
  timeRemaining,
  STATE_LABEL,
  formatVotes,
  shortenAddress,
} from "@/lib/types";

const BADGE: Record<0 | 1 | 2, string> = {
  0: "bg-active-bg text-active border-active/30",
  1: "bg-yes-light text-yes-color border-yes-color/30",
  2: "bg-no-light text-no-color border-no-color/30",
};

const STATE_BORDER: Record<0 | 1 | 2, string> = {
  0: "border-l-active",
  1: "border-l-yes-color",
  2: "border-l-no-color",
};

export default function ProposalPage() {
  const params = useParams();
  const id = params?.id as string;
  const proposalId = BigInt(id ?? "0");
  const { address, isConnected } = useAccount();

  const { data: proposalData, refetch } = useReadContract({
    address: QUORUM_ADDRESS,
    abi: QUORUM_ABI,
    functionName: "proposals",
    args: [proposalId],
    query: { refetchInterval: 10_000 },
  });

  const { data: voteData } = useReadContract({
    address: QUORUM_ADDRESS,
    abi: QUORUM_ABI,
    functionName: "getVote",
    args: [proposalId, address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  if (isConfirmed) refetch();

  if (!proposalData) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="h-8 w-48 animate-pulse bg-ink/5" />
        </main>
      </>
    );
  }

  const p = proposalData as unknown as Proposal;
  const state = effectiveState(p);
  const pct = yesPercent(p);
  const total = p.yesVotes + p.noVotes;
  const hasVoted = voteData ? (voteData as [boolean, boolean, bigint])[0] : false;
  const votedYes = voteData ? (voteData as [boolean, boolean, bigint])[1] : false;
  const isActive = state === 0;
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const expired = nowSec >= p.deadline;

  function castVote(yes: boolean) {
    writeContract({
      address: QUORUM_ADDRESS,
      abi: QUORUM_ABI,
      functionName: "vote",
      args: [proposalId, yes],
    });
  }

  function resolveProposal() {
    writeContract({
      address: QUORUM_ADDRESS,
      abi: QUORUM_ABI,
      functionName: "resolve",
      args: [proposalId],
    });
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/"
          className="font-mono text-xs text-ink/50 dark:text-[#EDE9E0]/50 hover:text-ink dark:hover:text-[#EDE9E0] transition-colors"
        >
          ← Proposals
        </Link>

        <div className={`mt-6 border border-ink/10 dark:border-[#EDE9E0]/10 border-l-4 ${STATE_BORDER[state]} bg-white dark:bg-[#252119] px-6 py-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-[#EDE9E0] leading-snug">
                {p.title}
              </h1>
              <p className="mt-2 font-mono text-xs text-ink/45 dark:text-[#EDE9E0]/45">
                Proposal #{String(p.id)} · by {shortenAddress(p.proposer)}
              </p>
            </div>
            <span className={`border font-mono text-xs px-2 py-1 ${BADGE[state]}`}>
              {STATE_LABEL[state]}
            </span>
          </div>

          <p className="mt-5 font-body text-sm leading-relaxed text-ink/80 dark:text-[#EDE9E0]/80">
            {p.description}
          </p>

          {/* Vote bar */}
          <div className="mt-8">
            <div className="flex h-2 w-full overflow-hidden bg-ink/10 dark:bg-[#EDE9E0]/10">
              {total > 0n && (
                <>
                  <div className="vote-bar-yes h-full" style={{ width: `${pct}%` }} />
                  <div className="vote-bar-no h-full" style={{ width: `${100 - pct}%` }} />
                </>
              )}
            </div>
            <div className="mt-2 flex justify-between font-mono text-xs text-ink/55 dark:text-[#EDE9E0]/55">
              <span className="text-yes-color font-medium">
                Yes — {pct}% ({formatVotes(p.yesVotes)} QRM)
              </span>
              <span className="text-no-color font-medium">
                No — {100 - pct}% ({formatVotes(p.noVotes)} QRM)
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-ink/40 dark:text-[#EDE9E0]/40">
              {total > 0n
                ? `${formatVotes(total)} QRM total · `
                : "No votes yet · "}
              {timeRemaining(p.deadline)}
            </p>
          </div>

          {/* Vote actions */}
          {isConnected && isActive && (
            <div className="mt-6 border-t border-ink/10 dark:border-[#EDE9E0]/10 pt-5">
              {hasVoted ? (
                <p className="font-mono text-xs text-ink/50 dark:text-[#EDE9E0]/50">
                  You voted{" "}
                  <span className={votedYes ? "text-yes-color" : "text-no-color"}>
                    {votedYes ? "Yes" : "No"}
                  </span>
                  .
                </p>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => castVote(true)}
                    disabled={isPending || isConfirming}
                    className="flex-1 border border-yes-color bg-yes-light py-2 font-body text-sm text-yes-color hover:bg-yes-color hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isPending || isConfirming ? "Confirming..." : "Vote Yes"}
                  </button>
                  <button
                    onClick={() => castVote(false)}
                    disabled={isPending || isConfirming}
                    className="flex-1 border border-no-color bg-no-light py-2 font-body text-sm text-no-color hover:bg-no-color hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isPending || isConfirming ? "Confirming..." : "Vote No"}
                  </button>
                </div>
              )}
              {isConfirmed && (
                <p className="mt-2 font-mono text-xs text-yes-color">
                  Vote confirmed on-chain.
                </p>
              )}
            </div>
          )}

          {/* Resolve action — show after deadline if not resolved */}
          {expired && !p.resolved && (
            <div className="mt-4 border-t border-ink/10 dark:border-[#EDE9E0]/10 pt-4">
              <p className="font-mono text-xs text-ink/50 dark:text-[#EDE9E0]/50 mb-2">
                Voting period has ended. Anyone can trigger resolution.
              </p>
              <button
                onClick={resolveProposal}
                disabled={isPending || isConfirming}
                className="border border-ink/30 dark:border-[#EDE9E0]/30 px-4 py-1.5 font-body text-sm hover:border-ink dark:hover:border-[#EDE9E0] transition-colors disabled:opacity-50"
              >
                {isPending || isConfirming ? "Confirming..." : "Resolve proposal"}
              </button>
            </div>
          )}

          {!isConnected && isActive && (
            <p className="mt-6 border-t border-ink/10 dark:border-[#EDE9E0]/10 pt-4 font-mono text-xs text-ink/45 dark:text-[#EDE9E0]/45">
              Connect your wallet to vote.
            </p>
          )}
        </div>

        {/* On-chain metadata */}
        <div className="mt-4 border border-ink/8 dark:border-[#EDE9E0]/8 px-5 py-4">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink/35 dark:text-[#EDE9E0]/35">
            On-chain record
          </p>
          <dl className="space-y-1 font-mono text-xs text-ink/55 dark:text-[#EDE9E0]/55">
            <div className="flex gap-4">
              <dt className="w-24 shrink-0">proposer</dt>
              <dd className="break-all">{p.proposer}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0">deadline</dt>
              <dd>{new Date(Number(p.deadline) * 1000).toUTCString()}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0">resolved</dt>
              <dd>{p.resolved ? "yes" : "no"}</dd>
            </div>
          </dl>
        </div>
      </main>
    </>
  );
}
