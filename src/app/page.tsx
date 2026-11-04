import Link from "next/link";
import { SubmitForm } from "@/components/SubmitForm";
import { getCurrentUser } from "@/lib/auth";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export default async function HomePage() {
  if (!hasSupabaseConfig()) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 sm:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[-0.04em]">
          Configure Supabase
        </h1>
        <p className="mt-4 text-[var(--ink-soft)]">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>, then run the SQL migration and
          seed script.
        </p>
      </div>
    );
  }

  const user = await getCurrentUser();

  return (
    <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 pb-20 pt-4 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-14 lg:pt-10">
      <section className="animate-rise lg:sticky lg:top-10">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--signal)]">
          Internal feedback
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(2.8rem,7vw,5.2rem)] leading-[0.92] font-semibold tracking-[-0.05em]">
          Signal
        </h1>
        <div className="brand-underline mt-4 h-1 w-24 rounded-full bg-[var(--signal-bright)]" />
        <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--ink-soft)]">
          Share feedback, feature ideas, or bugs. Managers triage status, tags,
          and follow-ups in one place.
        </p>
        <p className="mt-8 text-sm text-[var(--ink-soft)]">
          {user ? (
            <>
              Signed in as <strong className="text-[var(--ink)]">{user.name}</strong>
              {user.role === "admin" ? " · you can triage the board" : ""}.
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium text-[var(--signal-deep)]">
                Sign in
              </Link>{" "}
              or{" "}
              <Link href="/signup" className="font-medium text-[var(--signal-deep)]">
                create an account
              </Link>{" "}
              to send a signal.
            </>
          )}
        </p>
      </section>

      <section>
        {user ? (
          <SubmitForm />
        ) : (
          <div className="animate-rise-delay rounded-[28px] border border-[var(--line)] bg-[color-mix(in_oklab,white_70%,var(--paper))] p-8 shadow-[var(--shadow)]">
            <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.03em]">
              Org accounts only
            </h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              Sign in with your Supabase-backed org account to submit feedback.
            </p>
            <div className="mt-6 flex gap-2">
              <Link href="/login" className="btn btn-primary">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-ghost">
                Join
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
