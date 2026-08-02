import Link from "next/link";
import {
  Proposal,
  effectiveState,
  yesPercent,
  timeRemaining,
  STATE_LABEL,
  formatVotes,
  shortenAddress,
} from "@/lib/types";

const STATE_CLASSES: Record<0 | 1 | 2, string> = {
  0: "state-active",
  1: "state-approved",
  2: "state-rejected",
};

const BADGE_CLASSES: Record<0 | 1 | 2, string> = {
  0: "bg-active-bg text-active border-active/30 dark:bg-active-dark-bg",
  1: "bg-yes-light text-yes-color border-yes-color/30 dark:bg-yes-dark/20 dark:text-[#6ECF9A]",
  2: "bg-no-light text-no-color border-no-color/30 dark:bg-no-dark/20 dark:text-[#D98070]",
};

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  const state = effectiveState(proposal);
  const pct = yesPercent(proposal);
  const totalVotes = proposal.yesVotes + proposal.noVotes;

  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className={`block bg-white dark:bg-[#252119] border border-ink/10 dark:border-[#EDE9E0]/10 px-5 py-5 transition-shadow hover:shadow-sm fade-in ${STATE_CLASSES[state]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold leading-snug text-ink dark:text-[#EDE9E0] truncate">
            {proposal.title}
          </h2>
          <p className="mt-1 font-mono text-xs text-ink/40 dark:text-[#EDE9E0]/40">
            by {shortenAddress(proposal.proposer)}
          </p>
        </div>
        <span
          className={`shrink-0 border font-mono text-xs px-2 py-0.5 ${BADGE_CLASSES[state]}`}
        >
          {STATE_LABEL[state]}
        </span>
      </div>

      {/* Vote bar */}
      <div className="mt-4">
        <div className="flex h-1.5 w-full overflow-hidden bg-ink/10 dark:bg-[#EDE9E0]/10">
          {totalVotes > 0n && (
            <>
              <div className="vote-bar-yes h-full" style={{ width: `${pct}%` }} />
              <div className="vote-bar-no h-full" style={{ width: `${100 - pct}%` }} />
            </>
          )}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-xs text-ink/50 dark:text-[#EDE9E0]/50">
          <span>
            {totalVotes > 0n
              ? `${pct}% yes · ${formatVotes(totalVotes)} QRM cast`
              : "No votes yet"}
          </span>
          <span>{timeRemaining(proposal.deadline)}</span>
        </div>
      </div>
    </Link>
  );
}
