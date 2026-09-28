"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password" | "signup">("magic");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      const origin = window.location.origin;

      if (mode === "magic") {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${origin}/auth/callback?next=/account` },
        });
        if (err) throw err;
        setMessage("Check your email for the magic link.");
      } else if (mode === "password") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.href = "/account";
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/callback?next=/account` },
        });
        if (err) throw err;
        setMessage("Account created. Check your email to confirm if required, then sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4">
      <div className="flex gap-2 text-sm">
        {(
          [
            ["magic", "Magic link"],
            ["password", "Password"],
            ["signup", "Sign up"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-lg px-3 py-1.5 ${mode === id ? "bg-amber-soft text-amber" : "text-muted"}`}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="input"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {mode !== "magic" ? (
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      ) : null}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Continue"}
      </button>
      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}
