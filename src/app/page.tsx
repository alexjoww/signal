import { SubmitForm } from "@/components/SubmitForm";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
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
          Signed in as <strong className="text-[var(--ink)]">{user.name}</strong>
          {user.role === "admin" ? " · you can triage the board" : ""}.
        </p>
      </section>

      <section>
        <SubmitForm />
      </section>
    </div>
  );
}
