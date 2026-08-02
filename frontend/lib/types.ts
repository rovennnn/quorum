export type ProposalState = 0 | 1 | 2; // Active | Approved | Rejected

export interface Proposal {
  id: bigint;
  proposer: `0x${string}`;
  title: string;
  description: string;
  deadline: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  resolved: boolean;
  state: ProposalState;
}

export interface VoteRecord {
  hasVoted: boolean;
  votedYes: boolean;
  weight: bigint;
}

export const STATE_LABEL: Record<ProposalState, string> = {
  0: "Active",
  1: "Approved",
  2: "Rejected",
};

export function effectiveState(p: Proposal): ProposalState {
  if (p.resolved) return p.state;
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  if (nowSec < p.deadline) return 0;
  const total = p.yesVotes + p.noVotes;
  if (total > 0n && p.yesVotes > p.noVotes) return 1;
  return 2;
}

export function yesPercent(p: Proposal): number {
  const total = p.yesVotes + p.noVotes;
  if (total === 0n) return 0;
  return Number((p.yesVotes * 100n) / total);
}

export function timeRemaining(deadline: bigint): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const diff = Number(deadline) - nowSec;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h remaining`;
  const mins = Math.floor((diff % 3600) / 60);
  return `${hours}h ${mins}m remaining`;
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatVotes(wei: bigint): string {
  const whole = wei / BigInt(1e18);
  return whole.toLocaleString();
}
