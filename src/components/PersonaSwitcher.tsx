"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { User } from "@/lib/types";

export function PersonaSwitcher({
  current,
  users,
}: {
  current: User;
  users: User[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  async function switchTo(userId: string) {
    setOpen(false);
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    startTransition(() => router.refresh());
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
          {current.name}
          <span className="text-[var(--ink-soft)]"> · {current.role}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow)]">
          <p className="px-3 pt-3 pb-1 text-xs uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            Demo persona
          </p>
          <ul className="p-1.5">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => switchTo(u.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-[var(--mist-deep)] ${
                    u.id === current.id ? "bg-[var(--mist-deep)]" : ""
                  }`}
                >
                  <span>
                    <span className="block font-medium">{u.name}</span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      {u.email}
                    </span>
                  </span>
                  <span className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">
                    {u.role}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
