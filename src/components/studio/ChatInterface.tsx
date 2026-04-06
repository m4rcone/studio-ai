"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessage } from "@/lib/studio/use-chat";
import type { EditSession } from "@/lib/studio/types";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SessionBanner } from "./SessionBanner";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ToolCallStatus {
  name: string;
  status: "loading" | "done";
  summary?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls: ToolCallStatus[];
  isStreaming: boolean;
  isError?: boolean;
}

// ── Chat history persistence (localStorage, keyed by branch name) ─────────────

const ACTIVE_BRANCH_KEY = "studio:active-branch";

function storageKey(branchName: string) {
  return `studio:chat:${branchName}`;
}

function loadMessages(branchName: string): Message[] {
  try {
    const raw = localStorage.getItem(storageKey(branchName));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    // Always reset isStreaming — avoids infinite spinners if page closed mid-stream
    return parsed.map((m) => ({ ...m, isStreaming: false }));
  } catch {
    return [];
  }
}

function saveMessages(branchName: string, messages: Message[]): void {
  try {
    const serialized = messages.map((m) => ({ ...m, isStreaming: false }));
    localStorage.setItem(storageKey(branchName), JSON.stringify(serialized));
  } catch {
    // Silently ignore QuotaExceededError or sandboxed contexts
  }
}

function clearMessages(branchName: string): void {
  try {
    localStorage.removeItem(storageKey(branchName));
  } catch {}
}

/** Saves the active branch name so chat history can be restored after a server restart. */
function saveActiveBranch(branchName: string): void {
  try {
    localStorage.setItem(ACTIVE_BRANCH_KEY, branchName);
  } catch {}
}

/** Returns the last known active branch name, or null if none. */
function loadActiveBranch(): string | null {
  try {
    return localStorage.getItem(ACTIVE_BRANCH_KEY);
  } catch {
    return null;
  }
}

/** Clears the saved active branch (called on approve / discard / new chat). */
function clearActiveBranch(): void {
  try {
    localStorage.removeItem(ACTIVE_BRANCH_KEY);
  } catch {}
}

const SESSION_SNAPSHOT_KEY = "studio:session-snapshot";

/** Persists the full session object so it can be re-hydrated after a cold start. */
function saveSessionSnapshot(session: EditSession): void {
  try {
    localStorage.setItem(SESSION_SNAPSHOT_KEY, JSON.stringify(session));
  } catch {}
}

/** Returns the last persisted session snapshot, or null if none. */
function loadSessionSnapshot(): EditSession | null {
  try {
    const raw = localStorage.getItem(SESSION_SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as EditSession) : null;
  } catch {
    return null;
  }
}

/** Clears the session snapshot (called on approve / discard / new chat). */
function clearSessionSnapshot(): void {
  try {
    localStorage.removeItem(SESSION_SNAPSHOT_KEY);
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2);
}

function systemMessage(content: string): Message {
  return {
    id: makeId(),
    role: "assistant",
    content,
    toolCalls: [],
    isStreaming: false,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

const WELCOME =
  "Hi! I'm your content editing assistant. What would you like to change on the site?";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<EditSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  // Ref so the persist effect can always read the latest session without
  // adding session to its dependency array (which would cause extra writes).
  const sessionRef = useRef<EditSession | null>(null);
  // Tracks the last previewStatus reacted to — fires notifications exactly once per transition.
  const prevPreviewStatusRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keep sessionRef in sync and persist snapshot to localStorage.
  useEffect(() => {
    sessionRef.current = session;
    if (session?.status === "active") {
      saveSessionSnapshot(session);
      saveActiveBranch(session.branchName);
    }
  }, [session]);

  // Fetches the active session from the server, restoring from localStorage if
  // the server has lost it (cold start). Returns null if no session exists.
  // Used by both the mount effect and the polling interval.
  async function fetchOrRestoreSession(): Promise<EditSession | null> {
    const res = await fetch("/api/studio/session");
    if (!res.ok) return null;
    const data = (await res.json()) as EditSession;

    if (data.status !== "none") return data;

    // Server has no session — try to restore from the localStorage snapshot.
    const snapshot = loadSessionSnapshot();
    if (snapshot?.status === "active" && snapshot.branchName) {
      try {
        const restoreRes = await fetch("/api/studio/session/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        });
        if (restoreRes.ok) return (await restoreRes.json()) as EditSession;
      } catch {
        // Restore failed — return null so the caller decides how to handle it.
      }
    }

    return null;
  }

  // Fetch session on mount. Pre-seeds prevPreviewStatusRef so the notification
  // effect treats the initial state as a no-op and doesn't re-fire old toasts.
  // Falls back to localStorage history if no session can be recovered.
  useEffect(() => {
    async function initSession() {
      try {
        const active = await fetchOrRestoreSession();

        if (active) {
          prevPreviewStatusRef.current = active.previewStatus ?? null;
          saveActiveBranch(active.branchName);
          saveSessionSnapshot(active);
          setSession(active);
        } else {
          prevPreviewStatusRef.current = null;
          // Recover at least the chat history from localStorage.
          const savedBranch = loadActiveBranch();
          if (savedBranch) {
            const saved = loadMessages(savedBranch);
            if (saved.length > 0) setMessages(saved);
          }
        }
      } catch {
        prevPreviewStatusRef.current = null;
      }
    }

    void initSession();
  }, []);

  // Restore chat history from localStorage whenever the branch name is first known.
  // Fires when branchName transitions from undefined → an actual branch string.
  useEffect(() => {
    if (!session?.branchName) return;
    const saved = loadMessages(session.branchName);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved.length > 0) setMessages(saved);
  }, [session?.branchName]);

  // Persist messages to localStorage whenever they change (if a session is active).
  // Uses sessionRef to avoid adding session to the dependency array.
  useEffect(() => {
    const branchName = sessionRef.current?.branchName;
    if (!branchName || messages.length === 0) return;
    saveMessages(branchName, messages);
  }, [messages]);

  // Poll /api/studio/session every 5 s while preview is building.
  // Uses fetchOrRestoreSession so a cold start during polling doesn't wipe the banner.
  useEffect(() => {
    if (session?.previewStatus !== "building") return;

    const id = setInterval(async () => {
      try {
        const active = await fetchOrRestoreSession();
        if (!isMountedRef.current) return;
        setSession(active);
      } catch {
        // ignore transient errors
      }
    }, 5000);

    return () => clearInterval(id);
  }, [session?.previewStatus]);

  // Inject chat messages whenever the preview status transitions.
  useEffect(() => {
    const prev = prevPreviewStatusRef.current;
    const curr = session?.previewStatus ?? null;
    prevPreviewStatusRef.current = curr;

    // Transition → building
    if (curr === "building" && prev !== "building") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages((m) => [
        ...m,
        systemMessage(
          "Your changes are saved. Generating a preview — this usually takes 30–60 seconds.",
        ),
      ]);
    }

    // Transition → ready (from any previous state, not just "building").
    // The deployment can complete before the agent finishes, so previewStatus
    // may jump from null directly to "ready" without ever being "building" in
    // React state.
    if (curr === "ready" && session?.previewUrl && prev !== "ready") {
      setMessages((m) => [
        ...m,
        systemMessage(
          `Preview ready! [View your changes ↗](${session.previewUrl})`,
        ),
      ]);
    }

    // Transition → error (from any previous state)
    if (curr === "error" && prev !== "error") {
      setMessages((m) => [
        ...m,
        systemMessage(
          "Preview couldn't be generated, but your changes are saved. You can still approve or discard.",
        ),
      ]);
    }
  }, [session?.previewStatus, session?.previewUrl]);

  // Auto-scroll on message changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text: string) {
    if (isLoading) return;

    const userMsg: Message = {
      id: makeId(),
      role: "user",
      content: text,
      toolCalls: [],
      isStreaming: false,
    };

    const assistantId = makeId();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolCalls: [],
      isStreaming: true,
    };

    // Capture current messages for the API call (before the state update)
    const apiHistory = [...messages, userMsg].map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    await sendMessage(
      apiHistory,
      {
        onTextChunk(chunk) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        },

        onToolCall(name) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    toolCalls: [
                      ...m.toolCalls,
                      { name, status: "loading" as const },
                    ],
                  }
                : m,
            ),
          );
        },

        onSessionUpdate(newSession) {
          setSession(newSession as EditSession);
        },

        onToolResult(name, summary) {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              let patched = false;
              const toolCalls = [...m.toolCalls]
                .reverse()
                .map((tc) => {
                  if (!patched && tc.name === name && tc.status === "loading") {
                    patched = true;
                    return { ...tc, status: "done" as const, summary };
                  }
                  return tc;
                })
                .reverse();
              return { ...m, toolCalls };
            }),
          );
        },

        onDone(newSession: EditSession | null) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m,
            ),
          );
          if (newSession && newSession.status === "active") {
            setSession(newSession);
          }
          setIsLoading(false);
        },

        onError(error) {
          // Stop streaming on the assistant message (keep any partial content as-is).
          // Inject the error as a separate system message so it's visually distinct.
          setMessages((prev) => {
            const stopped = prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m,
            );
            // Only add error message if it's meaningful (not an empty-content interruption
            // where the user already sees a blank bubble — replace that bubble instead).
            const assistantMsg = stopped.find((m) => m.id === assistantId);
            if (assistantMsg && !assistantMsg.content) {
              // Bubble is empty — show the error in place of the bubble.
              return stopped.map((m) =>
                m.id === assistantId
                  ? { ...m, content: error, isStreaming: false }
                  : m,
              );
            }
            // Bubble has content — add a separate error message after it.
            return [...stopped, { ...systemMessage(error), isError: true }];
          });
          setIsLoading(false);
        },
      },
      sessionRef.current,
    );
  }

  function handleApproved() {
    const branchName = sessionRef.current?.branchName;
    if (branchName) clearMessages(branchName);
    clearActiveBranch();
    clearSessionSnapshot();
    setSession(null);
    setMessages((prev) => [
      ...prev,
      systemMessage(
        "Changes published! The site will update in about 1 minute. Feel free to start a new conversation.",
      ),
    ]);
  }

  function handleDiscarded() {
    const branchName = sessionRef.current?.branchName;
    if (branchName) clearMessages(branchName);
    clearActiveBranch();
    clearSessionSnapshot();
    setSession(null);
    setMessages((prev) => [
      ...prev,
      systemMessage("Changes discarded. Ready for a new conversation."),
    ]);
  }

  function handleNewChat() {
    const branchName = sessionRef.current?.branchName;
    if (branchName) clearMessages(branchName);
    clearActiveBranch();
    clearSessionSnapshot();
    setMessages([]);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="bg-background border-muted/60 flex min-h-0 flex-1 flex-col overflow-hidden rounded-(--radius) border shadow-sm">
      {/* Session banner */}
      {session && (
        <div className="shrink-0 px-4 pt-3">
          <SessionBanner
            session={session}
            onApproved={handleApproved}
            onDiscarded={handleDiscarded}
          />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* New chat button — shown only when there's history to clear */}
        {!isEmpty && (
          <div className="mb-3 flex justify-end">
            <button
              onClick={handleNewChat}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              + New chat
            </button>
          </div>
        )}

        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs text-center">
              <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
                AI
              </div>
              <p className="text-foreground/70 text-base">{WELCOME}</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                role={m.role}
                content={m.content}
                toolCalls={m.toolCalls}
                isStreaming={m.isStreaming}
                isError={m.isError}
              />
            ))}
          </>
        )}
        {/* Processing indicator — shown while the agent is running and has not
            yet emitted the streaming message (e.g. waiting for the first token). */}
        {isLoading && messages.every((m) => !m.isStreaming) && (
          <div className="mb-3 flex justify-start">
            <div className="bg-primary/10 text-primary mt-0.5 mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
              AI
            </div>
            <div className="bg-muted/60 rounded-[var(--radius)] px-4 py-3">
              <div className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
