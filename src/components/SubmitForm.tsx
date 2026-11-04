"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { PRODUCT_AREAS, TEAMS, TYPE_LABELS } from "@/lib/types";
import type { FeedbackType } from "@/lib/types";

export function SubmitForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<FeedbackType>("feedback");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onFile(file: File | null) {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("type", type);

    const res = await fetch("/api/feedback", { method: "POST", body: data });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Could not submit.");
      return;
    }

    setDone(true);
    form.reset();
    setPreview(null);
    setType("feedback");
    startTransition(() => router.refresh());
  }

  if (done) {
    return (
      <div className="animate-rise rounded-[28px] border border-[var(--line)] bg-[color-mix(in_oklab,white_70%,var(--paper))] p-8 shadow-[var(--shadow)] sm:p-10">
        <p className="text-sm uppercase tracking-[0.16em] text-[var(--signal)]">
          Sent
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-[-0.04em]">
          Thanks — your signal is in.
        </h2>
        <p className="mt-3 max-w-md text-[var(--ink-soft)]">
          Managers can triage it from the board. You can send another anytime.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-8"
          onClick={() => setDone(false)}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="animate-rise-delay rounded-[28px] border border-[var(--line)] bg-[color-mix(in_oklab,white_70%,var(--paper))] p-6 shadow-[var(--shadow)] sm:p-8"
    >
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_LABELS) as FeedbackType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              type === t
                ? "bg-[var(--signal-deep)] text-[var(--paper)]"
                : "bg-[var(--mist-deep)] text-[var(--ink-soft)] hover:bg-[color-mix(in_oklab,var(--mist-deep)_70%,white)]"
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <label className="mt-6 block">
        <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
          Title
        </span>
        <input
          name="title"
          required
          maxLength={120}
          className="field"
          placeholder="Short, specific summary"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
          Details
        </span>
        <textarea
          name="body"
          required
          rows={5}
          className="field resize-y"
          placeholder="What happened, what you expected, or why this matters"
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
            Team <span className="opacity-60">(optional)</span>
          </span>
          <select name="team" className="field" defaultValue="">
            <option value="">No team yet</option>
            {TEAMS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
            Product area <span className="opacity-60">(optional)</span>
          </span>
          <select name="product_area" className="field" defaultValue="">
            <option value="">No area yet</option>
            {PRODUCT_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
          Screenshot <span className="opacity-60">(optional)</span>
        </span>
        <input
          name="screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="field file:mr-3 file:rounded-full file:border-0 file:bg-[var(--mist-deep)] file:px-3 file:py-1.5 file:text-sm"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Screenshot preview"
          className="mt-4 max-h-56 w-full rounded-2xl object-cover object-top"
        />
      )}

      {error && (
        <p className="mt-4 text-sm text-[var(--bug)]" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-[var(--ink-soft)]">
          Visible to managers after you send.
        </p>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Send signal"}
        </button>
      </div>
    </form>
  );
}
