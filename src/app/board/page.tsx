import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BoardFilters } from "@/components/BoardFilters";
import { FeedbackList } from "@/components/FeedbackList";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { countByStatus, listFeedback } from "@/lib/db";
import type { FeedbackStatus, FeedbackType } from "@/lib/types";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/");

  const sp = await searchParams;
  const pick = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const items = await listFeedback({
    status: (pick("status") as FeedbackStatus | "all") || "all",
    team: pick("team"),
    product_area: pick("product_area"),
    type: (pick("type") as FeedbackType | "all") || "all",
    q: pick("q"),
  });
  const counts = await countByStatus();

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-4 sm:px-8">
      <div className="animate-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--signal)]">
            Manager view
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-[-0.04em] sm:text-5xl">
            Triage board
          </h1>
          <p className="mt-3 max-w-xl text-[var(--ink-soft)]">
            Assign status, tag by team or product area, and leave comments.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Stat label="New" value={counts.new} />
          <Stat label="In progress" value={counts.in_progress} />
          <Stat label="Done" value={counts.done} />
        </div>
      </div>

      <div className="animate-rise-delay mt-8">
        <Suspense fallback={null}>
          <BoardFilters />
        </Suspense>
      </div>

      <div className="animate-rise-delay-2 mt-6">
        <FeedbackList items={items} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[72px] text-right">
      <div className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.03em]">
        {value}
      </div>
      <div className="text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
        {label}
      </div>
    </div>
  );
}
