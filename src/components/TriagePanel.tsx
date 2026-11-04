"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  PRODUCT_AREAS,
  STATUS_LABELS,
  TEAMS,
  type Comment,
  type Feedback,
  type FeedbackStatus,
} from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function TriagePanel({
  item,
  comments,
  canTriage,
}: {
  item: Feedback;
  comments: Comment[];
  canTriage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<FeedbackStatus>(item.status);
  const [team, setTeam] = useState(item.team || "");
  const [area, setArea] = useState(item.product_area || "");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [thread, setThread] = useState(comments);

  async function saveMeta() {
    setError(null);
    const res = await fetch(`/api/feedback/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        team: team || null,
        product_area: area || null,
      }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Update failed");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function onComment(e: FormEvent) {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    setError(null);
    setComment("");
    const res = await fetch(`/api/feedback/${item.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    const json = await res.json();
    if (!res.ok) {
      setComment(text);
      setError(json.error || "Comment failed");
      return;
    }
    setThread((prev) => [...prev, json.comment]);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      {canTriage ? (
        <section className="rounded-[24px] border border-[var(--line)] bg-[color-mix(in_oklab,white_72%,var(--paper))] p-5 shadow-[var(--shadow)] sm:p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.03em]">
            Triage
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Status
              </span>
              <select
                className="field !py-2.5"
                value={status}
                onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
              >
                {(Object.keys(STATUS_LABELS) as FeedbackStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Team
              </span>
              <select
                className="field !py-2.5"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                <option value="">Untagged</option>
                {TEAMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Product area
              </span>
              <select
                className="field !py-2.5"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="">Untagged</option>
                {PRODUCT_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={saveMeta}
            disabled={pending}
          >
            Save triage
          </button>
        </section>
      ) : (
        <div className="flex items-center gap-3">
          <StatusBadge status={item.status} />
          <span className="text-sm text-[var(--ink-soft)]">
            {[item.team, item.product_area].filter(Boolean).join(" · ") ||
              "Not tagged yet"}
          </span>
        </div>
      )}

      <section className="rounded-[24px] border border-[var(--line)] bg-[color-mix(in_oklab,white_72%,var(--paper))] p-5 shadow-[var(--shadow)] sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-[-0.03em]">
          Comments
        </h2>
        <ul className="mt-4 space-y-4">
          {thread.length === 0 && (
            <li className="text-sm text-[var(--ink-soft)]">No comments yet.</li>
          )}
          {thread.map((c) => (
            <li key={c.id} className="border-t border-[var(--line)] pt-4 first:border-0 first:pt-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{c.author_name}</span>
                <time className="text-xs text-[var(--ink-soft)]">
                  {new Date(c.created_at).toLocaleString("en-US", {
                    timeZone: "America/New_York",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  ET
                </time>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-[var(--ink-soft)]">
                {c.body}
              </p>
            </li>
          ))}
        </ul>

        {canTriage && (
          <form onSubmit={onComment} className="mt-5">
            <textarea
              className="field resize-y"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a triage note…"
            />
            <button type="submit" className="btn btn-primary mt-3" disabled={pending}>
              Add comment
            </button>
          </form>
        )}
      </section>

      {error && (
        <p className="text-sm text-[var(--bug)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
