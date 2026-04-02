import type { CommitEntry } from "@/app/api/studio/history/route";

interface HistoryListProps {
  commits: CommitEntry[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Studio edits committed via the AI agent have a recognisable message prefix.
function isStudioEdit(message: string): boolean {
  return (
    message.startsWith("chore(studio):") ||
    message.startsWith("content(studio):")
  );
}

export function HistoryList({ commits }: HistoryListProps) {
  if (commits.length === 0) {
    return (
      <div className="text-muted-foreground py-16 text-center text-sm">
        No edits have been made yet.
      </div>
    );
  }

  return (
    <ol className="divide-muted flex flex-col divide-y">
      {commits.map((commit) => {
        const studio = isStudioEdit(commit.message);
        return (
          <li key={commit.sha} className="flex items-start gap-4 py-4">
            {/* Date column */}
            <div className="w-28 shrink-0 text-right">
              <p className="text-foreground text-xs font-medium">
                {formatDate(commit.date)}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatTime(commit.date)}
              </p>
            </div>

            {/* Connector dot */}
            <div className="mt-1 flex flex-col items-center">
              <span
                className={`h-2.5 w-2.5 rounded-full border-2 ${
                  studio
                    ? "border-secondary bg-secondary/30"
                    : "border-muted-foreground/30 bg-muted"
                }`}
              />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm leading-snug">
                {/* Strip the conventional commit prefix for studio edits */}
                {studio
                  ? commit.message.replace(
                      /^(chore|content)\(studio\):\s*/i,
                      "",
                    )
                  : commit.message}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                {studio && (
                  <span className="text-secondary text-[10px] font-medium tracking-wide uppercase">
                    Studio AI
                  </span>
                )}
                <span className="text-muted-foreground/60 font-mono text-[10px]">
                  {commit.sha.slice(0, 7)}
                </span>
                <span className="text-muted-foreground/50 text-[10px]">
                  by {commit.author}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
