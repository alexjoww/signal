"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PRODUCT_AREAS, TEAMS, TYPE_LABELS } from "@/lib/types";

export function BoardFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`/board?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="min-w-[140px] flex-1">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          Status
        </span>
        <select
          className="field !py-2.5"
          value={params.get("status") || "all"}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </label>
      <label className="min-w-[140px] flex-1">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          Team
        </span>
        <select
          className="field !py-2.5"
          value={params.get("team") || "all"}
          onChange={(e) => set("team", e.target.value)}
        >
          <option value="all">All teams</option>
          {TEAMS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-[140px] flex-1">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          Area
        </span>
        <select
          className="field !py-2.5"
          value={params.get("product_area") || "all"}
          onChange={(e) => set("product_area", e.target.value)}
        >
          <option value="all">All areas</option>
          {PRODUCT_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-[140px] flex-1">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          Type
        </span>
        <select
          className="field !py-2.5"
          value={params.get("type") || "all"}
          onChange={(e) => set("type", e.target.value)}
        >
          <option value="all">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-[180px] flex-[1.4]">
        <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          Search
        </span>
        <input
          className="field !py-2.5"
          placeholder="Title or details"
          defaultValue={params.get("q") || ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              set("q", (e.target as HTMLInputElement).value);
            }
          }}
          onBlur={(e) => set("q", e.target.value)}
        />
      </label>
    </div>
  );
}
