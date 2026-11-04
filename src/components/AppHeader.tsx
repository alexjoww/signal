import Link from "next/link";
import { AuthMenu } from "./AuthMenu";
import type { User } from "@/lib/types";

export function AppHeader({ user }: { user: User | null }) {
  const isAdmin = user?.role === "admin";

  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Link href="/" className="group flex items-center gap-2.5">
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--signal-deep)] text-[var(--paper)]">
          <span className="h-2 w-2 rounded-full bg-[var(--signal-bright)] signal-dot" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.03em]">
          Signal
        </span>
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2">
        {user && (
          <Link href="/" className="btn btn-ghost !py-2 !px-3 text-sm">
            Submit
          </Link>
        )}
        {isAdmin && (
          <Link href="/board" className="btn btn-ghost !py-2 !px-3 text-sm">
            Triage
          </Link>
        )}
        <AuthMenu user={user} />
      </nav>
    </header>
  );
}
