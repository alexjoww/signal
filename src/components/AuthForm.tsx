"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role: "member" },
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setError(
            "Account created. Confirm your email (or disable Confirm email in Supabase) then sign in.",
          );
          setPending(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="animate-rise rounded-[28px] border border-[var(--line)] bg-[color-mix(in_oklab,white_70%,var(--paper))] p-6 shadow-[var(--shadow)] sm:p-8"
    >
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.04em]">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-2 text-[var(--ink-soft)]">
        {mode === "login"
          ? "Use your org email to submit or triage signals."
          : "Join Signal to send feedback, features, and bug reports."}
      </p>

      {mode === "signup" && (
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
            Name
          </span>
          <input name="name" required className="field" placeholder="Alex Rivera" />
        </label>
      )}

      <label className={`block ${mode === "signup" ? "mt-4" : "mt-6"}`}>
        <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
          placeholder="you@acme.co"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="field"
          placeholder="At least 6 characters"
        />
      </label>

      {error && (
        <p className="mt-4 text-sm text-[var(--bug)]" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={pending}>
        {pending
          ? mode === "login"
            ? "Signing in…"
            : "Creating…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>

      <p className="mt-5 text-center text-sm text-[var(--ink-soft)]">
        {mode === "login" ? (
          <>
            No account yet?{" "}
            <Link href="/signup" className="font-medium text-[var(--signal-deep)]">
              Join
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--signal-deep)]">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
