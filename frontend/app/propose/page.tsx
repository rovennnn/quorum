"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { QUORUM_ADDRESS, TOKEN_ADDRESS } from "@/lib/wagmi";
import { QUORUM_ABI, TOKEN_ABI } from "@/lib/abi";
import { Nav } from "@/components/nav";

export default function ProposePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState(7);

  const { data: balance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    query: { enabled: !!address },
  });

  const hasTokens = balance ? (balance as bigint) > 0n : false;

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  if (isConfirmed) {
    setTimeout(() => router.push("/"), 1500);
  }

  function handleSubmit() {
    if (!title.trim() || !description.trim()) return;
    writeContract({
      address: QUORUM_ADDRESS,
      abi: QUORUM_ABI,
      functionName: "propose",
      args: [title.trim(), description.trim(), BigInt(days)],
    });
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-ink dark:text-[#EDE9E0]">
          Submit a proposal
        </h1>
        <p className="mt-2 font-body text-sm text-ink/55 dark:text-[#EDE9E0]/55">
          Quorum token holders can submit proposals. Your vote weight is your
          token balance at the time of each vote.
        </p>

        {!isConnected && (
          <div className="mt-6 border border-active/40 bg-active-bg px-4 py-3 font-mono text-sm text-active">
            Connect your wallet to submit a proposal.
          </div>
        )}

        {isConnected && !hasTokens && (
          <div className="mt-6 border border-no-color/40 bg-no-light px-4 py-3 font-mono text-sm text-no-color">
            You need Quorum tokens to submit a proposal.
          </div>
        )}

        {isConnected && hasTokens && (
          <div className="mt-8 space-y-5">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wide text-ink/50 dark:text-[#EDE9E0]/50 mb-1.5">
                Title <span className="text-no-color">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Short, specific proposal title"
                className="w-full border border-ink/20 dark:border-[#EDE9E0]/20 bg-white dark:bg-[#252119] px-3 py-2 font-body text-sm text-ink dark:text-[#EDE9E0] placeholder-ink/30 dark:placeholder-[#EDE9E0]/30 focus:border-ink dark:focus:border-[#EDE9E0] outline-none transition-colors"
              />
              <p className="mt-1 font-mono text-xs text-ink/35 dark:text-[#EDE9E0]/35 text-right">
                {title.length}/120
              </p>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wide text-ink/50 dark:text-[#EDE9E0]/50 mb-1.5">
                Description <span className="text-no-color">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Describe the proposal clearly — what problem it solves and how."
                className="w-full border border-ink/20 dark:border-[#EDE9E0]/20 bg-white dark:bg-[#252119] px-3 py-2 font-body text-sm text-ink dark:text-[#EDE9E0] placeholder-ink/30 dark:placeholder-[#EDE9E0]/30 focus:border-ink dark:focus:border-[#EDE9E0] outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wide text-ink/50 dark:text-[#EDE9E0]/50 mb-1.5">
                Voting period
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="flex-1 accent-yes-color"
                />
                <span className="font-mono text-sm w-16 text-right text-ink dark:text-[#EDE9E0]">
                  {days} {days === 1 ? "day" : "days"}
                </span>
              </div>
            </div>

            {error && (
              <p className="font-mono text-xs text-no-color">
                Error: {error.message.slice(0, 120)}
              </p>
            )}

            {isConfirmed && (
              <p className="font-mono text-xs text-yes-color">
                Proposal submitted! Redirecting...
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !description.trim() || isPending || isConfirming}
              className="w-full border border-ink dark:border-[#EDE9E0] py-2.5 font-body text-sm text-ink dark:text-[#EDE9E0] hover:bg-ink dark:hover:bg-[#EDE9E0] hover:text-parchment dark:hover:text-ink transition-colors disabled:opacity-40"
            >
              {isPending || isConfirming ? "Submitting..." : "Submit proposal"}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
