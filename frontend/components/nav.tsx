import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/12 bg-parchment/90 dark:bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight text-ink dark:text-[#EDE9E0]"
        >
          Quorum
          <span className="ml-2 font-mono text-xs font-normal text-ink/40 dark:text-[#EDE9E0]/40">
            governance
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="hidden font-body text-sm text-ink/60 dark:text-[#EDE9E0]/60 hover:text-ink dark:hover:text-[#EDE9E0] transition-colors sm:block"
          >
            Proposals
          </Link>
          <Link
            href="/propose"
            className="hidden font-body text-sm text-ink/60 dark:text-[#EDE9E0]/60 hover:text-ink dark:hover:text-[#EDE9E0] transition-colors sm:block"
          >
            Submit
          </Link>
          <Link
            href="/account"
            className="hidden font-body text-sm text-ink/60 dark:text-[#EDE9E0]/60 hover:text-ink dark:hover:text-[#EDE9E0] transition-colors sm:block"
          >
            My Tokens
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
