"use client";

import { useState, useEffect, ReactNode } from "react";

const STORAGE_KEY = "merch-admin-session";

export default function AdminPasswordGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(STORAGE_KEY);
    if (session) {
      // Verify session is still valid (within 24 hours)
      const parsed = JSON.parse(session);
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        setAuthenticated(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/merch/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ timestamp: Date.now() }),
      );
      setAuthenticated(true);
    } else {
      setError("Wrong password");
      setPassword("");
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-xl border border-border bg-card p-8"
        >
          <h2 className="mb-6 text-center text-xl font-semibold">
            Admin Access
          </h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-colors"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-secondary px-4 py-3 font-medium text-background transition-opacity hover:opacity-90"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
