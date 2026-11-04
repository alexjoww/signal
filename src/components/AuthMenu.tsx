"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export function AuthMenu({ user }: { user: User | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Link href="/login" className="btn btn-ghost !py-2 !px-3 text-sm">
          Sign in
        </Link>
        <Link href="/signup" className="btn btn-primary !py-2 !px-3 text-sm">
          Join
        </Link>
      </div>
    );
  }

  async function signOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-ghost !py-2 !px-3 text-sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        disabled={pending}
      >
        <span className="inline-flex h-2 w-2 rounded-full bg-[var(--signal-bright)] signal-dot" />
        <span className="max-w-[140px] truncate">
          {user.name}
          <span className="text-[var(--ink-soft)]"> · {user.role}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow)]">
          <div className="border-b border-[var(--line)] px-3 py-3">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-[var(--ink-soft)]">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="w-full px-3 py-2.5 text-left text-sm transition hover:bg-[var(--mist-deep)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
