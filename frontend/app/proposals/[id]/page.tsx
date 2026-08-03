"use client";

import { useEffect, Component, ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useReadContract,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { QUORUM_ADDRESS } from "@/lib/wagmi";
import { QUORUM_ABI } from "@/lib/abi";
import { Nav } from "@/components/nav";
import {
  effectiveState,
  yesPercent,
  timeRemaining,
  STATE_LABEL,
  formatVotes,
  shortenAddress,
} from "@/lib/types";

// Error boundary — catches any render crash and shows the message on screen
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message + "\n" + error.stack };
  }
  render() {
    if (this.state.error) {
      return (
        <>
          <Nav />
          <main className="mx-auto max-w-4xl px-6 py-10">
            <Link href="/" className="font-mono text-xs text-ink/50">
              ← Proposals
            </Link>
            <div className="mt-6 border border-no-color/40 bg-no-light p-5">
              <p className="font-mono text-xs font-bold text-no-color mb-2">
                Runtime error — paste this in the chat:
              </p>
              <pre className="font-mono text-xs text-no-color whitespace-pre-wrap break-all">
                {this.state.error}
              </pre>
            </div>
          </main>
        </>
      );
    }
    return this.props.children;
  }
}

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

function ProposalDetail() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "1";

  let proposalId: bigint;
  try {
    proposalId = BigInt(id);
  } catch {
    proposalId = 1n;
  }

  const { address, isConnected } = useAccount();

  const { data: raw, refetch } = useReadContract({
    address: QUORUM_ADDRESS,
    abi: QUORUM_ABI,
    functionName: "proposals",
    args: [proposalId],
    query: { refetchInterval: 12_000, enabled: !!QUORUM_ADDRESS },
  });

  const { data: voteRaw } = useReadContract({
    address: QUORUM_ADDRESS,
    abi: QUORUM_ABI,
    functionName: "getVote",
    args: [
      proposalId,
      address ?? "0x0000000000000000000000000000000000000000",
    ],
    query: { enabled: !!address && !!QUORUM_ADDRESS },
  });

  const { writeContract, data: txHash, isPending, error: writeError } =
    useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirmed) refetch();
  }, [isConfirmed, refetch]);

  if (!raw) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <Link href="/" className="font-mono text-xs text-ink/50">
            ← Proposals
          </Link>
          <div className="mt-6 space-y-3">
            <div className="h-8 w-2/3 animate-pulse bg-ink/5" />
            <div className="h-4 w-1/3 animate-pulse bg-ink/5" />
          </div>
        </main>
      </>
    );
  }

  // Safely extract fields — raw may be a tuple or object depending on wagmi version
  const anyRaw = raw as unknown as Record<string, unknown>;

  const pid: bigint = (anyRaw.id as bigint) ?? proposalId;
  const proposer: string = (anyRaw.proposer as string) ?? "";
  const title: string = (anyRaw.title as string) ?? "";
  const description: string = (anyRaw.description as string) ?? "";
  const deadline: bigint = (anyRaw.deadline as bigint) ?? 0n;
  const yesVotes: bigint = (anyRaw.yesVotes as bigint) ?? 0n;
  const noVotes: bigint = (anyRaw.noVotes as bigint) ?? 0n;
  const resolved: boolean = (anyRaw.resolved as boolean) ?? false;
  const stateNum: number = (anyRaw.state as number) ?? 0;

  const proposal = {
    id: pid,
    proposer: proposer as `0x${string}`,
    title,
    description,
    deadline,
    yesVotes,
    noVotes,
    resolved,
    state: stateNum as 0 | 1 | 2,
  };

  const state = effectiveState(proposal);
  const pct = yesPercent(proposal);
  const total = proposal.yesVotes + proposal.noVotes;

  const voteAny = voteRaw as Record<string, unknown> | undefined;
  const hasVoted = (voteAny?.hasVoted as boolean) ?? false;
  const votedYes = (voteAny?.votedYes as boolean) ?? false;

  const isActive = state === 0;
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const expired = nowSec >= proposal.deadline;

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
          className="font-mono text-xs text-ink/50 dark:text-[#EDE9E0]/50 hover:text-ink transition-colors"
        >
          ← Proposals
        </Link>

        <div
          className={`mt-6 border border-ink/10 dark:border-[#EDE9E0]/10 border-l-4 ${STATE_BORDER[state]} bg-white dark:bg-[#252119] px-6 py-6`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink dark:text-[#EDE9E0] leading-snug">
                {proposal.title}
              </h1>
              <p className="mt-2 font-mono text-xs text-ink/45 dark:text-[#EDE9E0]/45">
                Proposal #{String(proposal.id)} · by {shortenAddress(proposal.proposer)}
              </p>
            </div>
            <span className={`border font-mono text-xs px-2 py-1 ${BADGE[state]}`}>
              {STATE_LABEL[state]}
            </span>
          </div>

          <p className="mt-5 font-body text-sm leading-relaxed text-ink/80 dark:text-[#EDE9E0]/80">
            {proposal.description}
          </p>

          <div className="mt-8">
            <div className="flex h-2 w-full overflow-hidden bg-ink/10 dark:bg-[#EDE9E0]/10">
              {total > 0n && (
                <>
                  <div className="vote-bar-yes h-full" style={{ width: `${pct}%` }} />
                  <div className="vote-bar-no h-full" style={{ width: `${100 - pct}%` }} />
                </>
              )}
            </div>
            <div className="mt-2 flex justify-between font-mono text-xs">
              <span className="text-yes-color font-medium">
                Yes — {pct}% ({formatVotes(proposal.yesVotes)} QRM)
              </span>
              <span className="text-no-color font-medium">
                No — {100 - pct}% ({formatVotes(proposal.noVotes)} QRM)
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-ink/40 dark:text-[#EDE9E0]/40">
              {total > 0n ? `${formatVotes(total)} QRM total · ` : "No votes yet · "}
              {timeRemaining(proposal.deadline)}
            </p>
          </div>

          {isConnected && isActive && (
            <div className="mt-6 border-t border-ink/10 pt-5">
              {hasVoted ? (
                <p className="font-mono text-xs text-ink/50">
                  You voted{" "}
                  <span className={votedYes ? "text-yes-color" : "text-no-color"}>
                    {votedYes ? "Yes" : "No"}
                  </span>.
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
                <p className="mt-2 font-mono text-xs text-yes-color">Vote confirmed on-chain.</p>
              )}
              {writeError && (
                <p className="mt-2 font-mono text-xs text-no-color">
                  {writeError.message.slice(0, 200)}
                </p>
              )}
            </div>
          )}

          {expired && !proposal.resolved && (
            <div className="mt-4 border-t border-ink/10 pt-4">
              <p className="font-mono text-xs text-ink/50 mb-2">
                Voting period has ended. Anyone can trigger resolution.
              </p>
              <button
                onClick={resolveProposal}
                disabled={isPending || isConfirming}
                className="border border-ink/30 px-4 py-1.5 font-body text-sm hover:border-ink transition-colors disabled:opacity-50"
              >
                {isPending || isConfirming ? "Confirming..." : "Resolve proposal"}
              </button>
            </div>
          )}

          {!isConnected && isActive && (
            <p className="mt-6 border-t border-ink/10 pt-4 font-mono text-xs text-ink/45">
              Connect your wallet to vote.
            </p>
          )}
        </div>

        <div className="mt-4 border border-ink/8 px-5 py-4">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink/35">
            On-chain record
          </p>
          <dl className="space-y-1 font-mono text-xs text-ink/55">
            <div className="flex gap-4">
              <dt className="w-24 shrink-0">proposer</dt>
              <dd className="break-all">{proposal.proposer}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0">deadline</dt>
              <dd>{new Date(Number(proposal.deadline) * 1000).toUTCString()}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 shrink-0">resolved</dt>
              <dd>{proposal.resolved ? "yes" : "no"}</dd>
            </div>
          </dl>
        </div>
      </main>
    </>
  );
}

export default function ProposalPage() {
  return (
    <ErrorBoundary>
      <ProposalDetail />
    </ErrorBoundary>
  );
}
