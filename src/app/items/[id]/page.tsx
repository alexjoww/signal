import Link from "next/link";
import { notFound } from "next/navigation";
import { TriagePanel } from "@/components/TriagePanel";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getFeedback, listComments } from "@/lib/db";
import { TYPE_LABELS } from "@/lib/types";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getFeedback(id);
  if (!item) notFound();

  const user = await getCurrentUser();
  const comments = listComments(id);
  const canTriage = isAdmin(user);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-4 sm:px-8">
      <Link
        href={canTriage ? "/board" : "/"}
        className="text-sm text-[var(--ink-soft)] transition hover:text-[var(--ink)]"
      >
        ← {canTriage ? "Back to board" : "Back to submit"}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="animate-rise">
          <p className={`text-sm font-semibold uppercase tracking-[0.14em] type-${item.type}`}>
            {TYPE_LABELS[item.type]}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-[-0.04em] sm:text-5xl">
            {item.title}
          </h1>
          <p className="mt-4 text-sm text-[var(--ink-soft)]">
            From {item.author_name} ·{" "}
            {new Date(item.created_at).toLocaleString("en-US", {
              timeZone: "America/New_York",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            ET
          </p>
          <div className="mt-8 whitespace-pre-wrap text-lg leading-relaxed text-[var(--ink-soft)]">
            {item.body}
          </div>
          {item.screenshot_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.screenshot_path}
              alt="Attached screenshot"
              className="mt-8 max-h-[480px] w-full rounded-[24px] border border-[var(--line)] object-contain object-top bg-white"
            />
          )}
        </article>

        <div className="animate-rise-delay">
          <TriagePanel item={item} comments={comments} canTriage={canTriage} />
        </div>
      </div>
    </div>
  );
}
