import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { TYPE_LABELS, type Feedback } from "@/lib/types";

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function FeedbackList({ items }: { items: Feedback[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[var(--line)] px-6 py-16 text-center text-[var(--ink-soft)]">
        No signals match these filters.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-[24px] border border-[var(--line)] bg-[color-mix(in_oklab,white_72%,var(--paper))] shadow-[var(--shadow)]">
      {items.map((item, i) => (
        <li
          key={item.id}
          className="animate-rise"
          style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
        >
          <Link
            href={`/items/${item.id}`}
            className="flex flex-col gap-3 px-5 py-4 transition hover:bg-[color-mix(in_oklab,var(--signal-bright)_8%,transparent)] sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                <span className={`text-xs font-semibold uppercase tracking-wide type-${item.type}`}>
                  {TYPE_LABELS[item.type]}
                </span>
              </div>
              <h3 className="mt-2 truncate font-[family-name:var(--font-display)] text-lg tracking-[-0.03em]">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-1 text-sm text-[var(--ink-soft)]">
                {item.body}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--ink-soft)] sm:flex-col sm:items-end sm:text-right">
              <span>
                {[item.team, item.product_area].filter(Boolean).join(" · ") ||
                  "Untagged"}
              </span>
              <span>
                {item.author_name} · {relativeTime(item.updated_at)}
                {item.comment_count
                  ? ` · ${item.comment_count} comment${item.comment_count === 1 ? "" : "s"}`
                  : ""}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
