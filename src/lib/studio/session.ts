import {
  createBranch,
  deleteBranch,
  createPullRequest,
  updatePullRequest,
  mergePullRequest,
  closePullRequest,
  waitForPreviewUrl,
} from "./github";
import { env } from "./env";
import type { EditSession, ChangeRecord } from "./types";

// ---------------------------------------------------------------------------
// In-memory store: one active session per username
// ---------------------------------------------------------------------------
const sessions = new Map<string, EditSession>();

// ---------------------------------------------------------------------------
// Branch name helper
// ---------------------------------------------------------------------------

/** Converts a human description to a kebab-case slug, max 30 chars. */
export function generateBranchName(description: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
  ].join("");
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;

  const slug = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "") // strip special chars
    .trim()
    .replace(/[\s-]+/g, "-"); // spaces/dashes → single dash

  // Truncate to 30 chars without cutting mid-word
  let truncated = slug.slice(0, 30);
  if (slug.length > 30) {
    const lastDash = truncated.lastIndexOf("-");
    truncated = lastDash > 0 ? truncated.slice(0, lastDash) : truncated;
  }

  return `edit/${date}-${time}-${truncated}`;
}

// ---------------------------------------------------------------------------
// PR body helpers
// ---------------------------------------------------------------------------

function buildPrTitle(changes: ChangeRecord[]): string {
  const first = changes[0]?.description ?? "Content update";
  const prefix = "Studio AI: ";
  const max = 72 - prefix.length;
  const slug = first.length > max ? first.slice(0, max - 1) + "…" : first;
  return `${prefix}${slug}`;
}

function buildPrBody(changes: ChangeRecord[]): string {
  const items = changes.map((c) => `- ${c.description}`).join("\n");
  return `## Content changes\n\n${items}\n\n_This PR was created by Studio AI._`;
}

// ---------------------------------------------------------------------------
// Background preview URL polling
// Updates the session once the Vercel deployment becomes available.
// ---------------------------------------------------------------------------

function pollPreviewUrl(username: string, prNumber: number): void {
  void (async () => {
    try {
      const url = await waitForPreviewUrl(prNumber, {
        maxAttempts: 24,
        intervalMs: 10000,
      });
      const session = sessions.get(username);
      if (!session) return;
      if (url) {
        session.previewUrl = withBypass(url);
        session.previewStatus = "ready";
      } else {
        session.previewStatus = "error";
      }
    } catch {
      const session = sessions.get(username);
      if (session) session.previewStatus = "error";
    }
  })();
}

// ---------------------------------------------------------------------------
// Bypass URL helper
// ---------------------------------------------------------------------------

/**
 * Appends the Vercel protection bypass token to a preview URL so anyone with
 * the link can view it without a Vercel account.
 * - Uses `x-vercel-set-bypass-cookie=samesitenone` (correct per Vercel docs).
 * - No-ops if the URL already has the bypass param or no secret is configured.
 */
export function withBypass(url: string): string {
  const bypass = env.vercel.bypassSecret;
  if (!bypass) {
    console.warn(
      "[studio] VERCEL_AUTOMATION_BYPASS_SECRET is not set — preview URLs will require Vercel authentication",
    );
    return url;
  }
  if (url.includes("x-vercel-protection-bypass")) return url;
  return `${url}?x-vercel-protection-bypass=${bypass}&x-vercel-set-bypass-cookie=samesitenone`;
}

// ---------------------------------------------------------------------------
// Session manager
// ---------------------------------------------------------------------------

/**
 * Creates a new session: generates a branch name and creates the branch.
 * The PR is opened after the first commit (in recordChange).
 */
export async function createSession(
  username: string,
  description: string,
): Promise<EditSession> {
  const existing = sessions.get(username);
  if (existing && existing.status === "active") {
    throw new Error(
      `User ${username} already has an active session on branch "${existing.branchName}". Approve or discard it first.`,
    );
  }

  const branchName = generateBranchName(description);
  await createBranch(branchName);

  const session: EditSession = {
    branchName,
    prNumber: 0,
    prUrl: "",
    previewUrl: null,
    previewStatus: "building",
    changes: [],
    status: "active",
    createdAt: new Date().toISOString(),
  };

  sessions.set(username, session);
  return session;
}

/** Returns the active session for a user, or null if none exists. */
export function getSession(username: string): EditSession | null {
  return sessions.get(username) ?? null;
}

/**
 * Restores a session from client-provided snapshot (e.g. after a serverless cold start).
 * No-ops if the user already has an active session in memory.
 * If the session was mid-poll (previewStatus "building"), resumes the polling loop.
 */
export function restoreSession(
  username: string,
  snapshot: EditSession,
): EditSession {
  const existing = sessions.get(username);
  if (existing) return existing;

  const session: EditSession = { ...snapshot };
  sessions.set(username, session);

  // Resume preview polling if it hadn't resolved yet
  if (
    session.status === "active" &&
    session.previewStatus === "building" &&
    session.prNumber > 0
  ) {
    pollPreviewUrl(username, session.prNumber);
  }

  return session;
}

/**
 * Appends a change record to the session.
 * On the first change: opens a Pull Request and starts polling for the preview URL.
 * On subsequent changes: updates the PR body with the cumulative change list.
 */
export async function recordChange(
  username: string,
  change: ChangeRecord,
): Promise<void> {
  const session = sessions.get(username);
  if (!session || session.status !== "active") {
    throw new Error(`No active session found for ${username}`);
  }

  session.changes.push(change);

  if (session.changes.length === 1) {
    // First change — create the PR
    try {
      const pr = await createPullRequest({
        title: buildPrTitle(session.changes),
        body: buildPrBody(session.changes),
        head: session.branchName,
      });
      session.prNumber = pr.number;
      session.prUrl = pr.html_url;
      // Fire-and-forget: poll for the Vercel preview URL in the background
      pollPreviewUrl(username, pr.number);
    } catch (err) {
      console.error("[studio] Failed to create PR:", err);
      session.previewStatus = "error";
    }
  } else if (session.prNumber > 0) {
    // Subsequent changes — update PR description and restart preview polling.
    // A new commit on the branch triggers a new Vercel deployment, so the old
    // preview URL becomes stale. Reset status to "building" so the UI shows
    // the progress indicator and the polling loop picks up the new URL.
    session.previewUrl = null;
    session.previewStatus = "building";
    pollPreviewUrl(username, session.prNumber);

    try {
      await updatePullRequest(session.prNumber, buildPrBody(session.changes));
    } catch {
      // Non-fatal
    }
  }
}

/**
 * Squash-merges the pull request, then cleans up the branch and session.
 */
export async function approveSession(username: string): Promise<void> {
  const session = sessions.get(username);
  if (!session) throw new Error(`No session found for ${username}`);

  session.status = "merging";

  try {
    if (session.prNumber > 0) {
      await mergePullRequest(session.prNumber, buildPrTitle(session.changes));
      // Delete the branch (GitHub may auto-delete if configured, ignore error)
      try {
        await deleteBranch(session.branchName);
      } catch {
        // Already deleted — that's fine
      }
    } else {
      throw new Error("No pull request exists for this session. Cannot merge.");
    }
  } finally {
    sessions.delete(username);
  }
}

/**
 * Closes the pull request without merging, deletes the branch, and clears the session.
 */
export async function discardSession(username: string): Promise<void> {
  const session = sessions.get(username);
  if (!session) throw new Error(`No session found for ${username}`);

  try {
    if (session.prNumber > 0) {
      await closePullRequest(session.prNumber);
    }
    await deleteBranch(session.branchName);
  } finally {
    sessions.delete(username);
  }
}
