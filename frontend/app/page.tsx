import Link from "next/link";
import { Nav } from "@/components/nav";
import { ProposalsList } from "@/components/proposals-list";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink dark:text-[#EDE9E0]">
              Proposals
            </h1>
            <p className="mt-1 font-body text-sm text-ink/55 dark:text-[#EDE9E0]/55">
              Token holders vote on community decisions. Results are recorded
              on-chain and cannot be altered.
            </p>
          </div>
          <Link
            href="/propose"
            className="shrink-0 border border-ink/30 dark:border-[#EDE9E0]/30 px-4 py-2 font-body text-sm hover:border-ink dark:hover:border-[#EDE9E0] transition-colors"
          >
            Submit proposal
          </Link>
        </div>

        <div className="mt-8">
          <ProposalsList />
        </div>

        {/* What is Quorum */}
        <section className="mt-16 border-t border-ink/10 dark:border-[#EDE9E0]/10 pt-10">
          <h2 className="font-display text-xl font-bold text-ink dark:text-[#EDE9E0]">
            How it works
          </h2>
          <div className="mt-4 grid gap-6 font-body text-sm leading-relaxed text-ink/75 dark:text-[#EDE9E0]/75 sm:grid-cols-3">
            <div>
              <p className="font-semibold text-ink dark:text-[#EDE9E0]">Propose</p>
              <p className="mt-1">
                Any Quorum token holder can submit a proposal with a title,
                description, and voting period (1–30 days).
              </p>
            </div>
            <div>
              <p className="font-semibold text-ink dark:text-[#EDE9E0]">Vote</p>
              <p className="mt-1">
                Token holders vote Yes or No. Your vote weight equals your
                token balance — more tokens, more influence.
              </p>
            </div>
            <div>
              <p className="font-semibold text-ink dark:text-[#EDE9E0]">Resolve</p>
              <p className="mt-1">
                After the deadline, anyone can trigger resolution. Approved if
                Yes outweighs No. The result is permanent and public on-chain.
              </p>
            </div>
          </div>
          <p className="mt-6 font-mono text-xs text-ink/40 dark:text-[#EDE9E0]/40">
            This is a Sepolia testnet deployment — tokens have no monetary
            value. See the{" "}
            <a
              href="https://github.com/rovennnn/quorum"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              GitHub repo
            </a>{" "}
            for how this differs from a Hyperledger Fabric voting system.
          </p>
        </section>
      </main>
    </>
  );
}
