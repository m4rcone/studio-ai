"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/studio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (data.success) {
        router.push("/studio-ai");
        router.refresh();
      } else {
        setError(data.error ?? "Invalid credentials");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-muted bg-background rounded-(--radius) " +
    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 " +
    "placeholder:text-muted-foreground transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="username"
          className="text-foreground/70 text-xs font-medium tracking-wide uppercase"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="seu-usuario"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-foreground/70 text-xs font-medium tracking-wide uppercase"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-(--radius) border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary text-primary-foreground w-full cursor-pointer rounded-(--radius) px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
