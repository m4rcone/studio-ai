"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

interface SessionData {
  status: "active" | "merging" | "none";
  branchName?: string;
  prNumber?: number;
  prUrl?: string;
  previewUrl?: string | null;
  previewStatus?: "building" | "ready" | "error";
  changes?: Array<{ file: string; description: string; timestamp: string }>;
}

// ── Controlled (chat page passes session from outside) ───────────────────────
interface ControlledProps {
  /** Session state managed by the parent. Set to null to hide the banner. */
  session: SessionData | null;
  /** Called after banner successfully approves. Parent should clear its session state. */
  onApproved: () => void;
  /** Called after banner successfully discards. Parent should clear its session state. */
  onDiscarded: () => void;
  onSessionChange?: never;
}

// ── Uncontrolled (dashboard — banner fetches its own state) ──────────────────
interface UncontrolledProps {
  session?: undefined;
  onApproved?: never;
  onDiscarded?: never;
  /** Called after any approve/discard action completes. */
  onSessionChange?: () => void;
}

type SessionBannerProps = ControlledProps | UncontrolledProps;

export function SessionBanner(props: SessionBannerProps) {
  const isControlled = props.session !== undefined;

  const [ownSession, setOwnSession] = useState<SessionData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(!isControlled);
  const [actionLoading, setActionLoading] = useState<
    "approve" | "discard" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isControlled) return;
    void fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for preview URL when status is 'building' (uncontrolled mode only)
  useEffect(() => {
    if (isControlled) return;
    const building = ownSession?.previewStatus === "building";

    if (building && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const res = await fetch("/api/studio/session").catch(() => null);
        if (!res?.ok) return;
        const data = (await res.json()) as SessionData;
        if (!isMountedRef.current) return;
        if (data.status === "none") {
          setOwnSession(null);
        } else {
          setOwnSession(data);
        }
        if (data.previewStatus !== "building") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
      }, 5000);
    }

    if (!building && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [ownSession?.previewStatus, isControlled]);

  async function fetchSession() {
    try {
      const res = await fetch("/api/studio/session");
      const data = (await res.json()) as SessionData;
      setOwnSession(data.status === "none" ? null : data);
    } catch {
      setOwnSession(null);
    } finally {
      setFetchLoading(false);
    }
  }

  const session = isControlled ? props.session : ownSession;

  async function handleApprove() {
    setActionLoading("approve");
    setActionError(null);
    try {
      const res = await fetch("/api/studio/session/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionSnapshot: session }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const msg = body || `Server error (${res.status})`;
        console.error("[studio] Approve failed:", msg);
        setActionError(`Failed to publish: ${msg}`);
        return;
      }
      if (!isControlled) setOwnSession(null);
      if (isControlled) {
        props.onApproved();
      } else {
        props.onSessionChange?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection error";
      setActionError(`Failed to publish: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDiscardConfirmed() {
    setActionLoading("discard");
    setActionError(null);
    try {
      const res = await fetch("/api/studio/session/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionSnapshot: session }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const msg = body || `Server error (${res.status})`;
        console.error("[studio] Discard failed:", msg);
        setActionError(`Failed to discard: ${msg}`);
        return;
      }
      setShowDiscardModal(false);
      if (!isControlled) setOwnSession(null);
      if (isControlled) {
        props.onDiscarded();
      } else {
        props.onSessionChange?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection error";
      setActionError(`Failed to discard: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  }

  if (fetchLoading || !session) return null;

  const changeCount = session.changes?.length ?? 0;

  return (
    <>
      <ConfirmModal
        open={showDiscardModal}
        title="Discard changes?"
        description={
          changeCount > 0
            ? `This will permanently delete ${changeCount} pending change${changeCount === 1 ? "" : "s"} and close the preview. This cannot be undone.`
            : "This will close the current session. This cannot be undone."
        }
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        loading={actionLoading === "discard"}
        onConfirm={handleDiscardConfirmed}
        onCancel={() => setShowDiscardModal(false)}
      />

      <div className="border-secondary/40 bg-secondary/10 flex flex-col gap-3 rounded-[var(--radius)] border p-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-medium">
            {changeCount === 0
              ? "Session open — no changes yet"
              : `${changeCount} pending change${changeCount === 1 ? "" : "s"}`}
          </p>
          {session.previewStatus === "building" && (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
              <span className="inline-block h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
              Generating preview… (30–60 seconds)
            </p>
          )}
          {session.previewStatus === "ready" && session.previewUrl && (
            <a
              href={session.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 mt-0.5 block truncate text-xs font-medium underline underline-offset-2"
            >
              View preview ↗
            </a>
          )}
          {session.previewStatus === "error" && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              Preview unavailable. Your changes are saved — approve or discard
              when ready.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isControlled && (
            <Link
              href="/studio-ai/chat"
              className="border-foreground/20 text-foreground hover:border-foreground/50 rounded-[var(--radius)] border px-3 py-1.5 text-xs transition-colors"
            >
              Continue editing
            </Link>
          )}
          <button
            onClick={handleApprove}
            disabled={actionLoading !== null}
            className="bg-primary text-primary-foreground cursor-pointer rounded-[var(--radius)] px-3 py-1.5 text-xs transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {actionLoading === "approve" ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Publishing…
              </span>
            ) : (
              "Publish"
            )}
          </button>
          <button
            onClick={() => setShowDiscardModal(true)}
            disabled={actionLoading !== null}
            className="border-foreground/20 cursor-pointer rounded-[var(--radius)] border px-3 py-1.5 text-xs transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-50"
          >
            Discard
          </button>
        </div>

        {actionError && (
          <p className="mt-2 text-xs text-red-600">{actionError}</p>
        )}
      </div>
    </>
  );
}
