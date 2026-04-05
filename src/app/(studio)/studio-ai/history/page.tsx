"use client";

import { useEffect, useState } from "react";
import type { CommitEntry } from "@/app/api/studio/history/route";
import { HistoryList } from "@/components/studio/HistoryList";

export default function HistoryPage() {
  const [commits, setCommits] = useState<CommitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/studio/history")
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json() as Promise<{ commits: CommitEntry[] }>;
      })
      .then((data) => setCommits(data.commits))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load history"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="font-heading text-foreground text-2xl">
            Edit History
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Recent commits on the main branch.
          </p>
        </div>

        {loading && (
          <div className="text-muted-foreground py-16 text-center text-sm">
            Loading history…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-[var(--radius)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && <HistoryList commits={commits} />}
      </div>
    </div>
  );
}
