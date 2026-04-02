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
}

type SessionData = {
  status: "active" | "merging" | "none";
  branchName?: string;
  previewUrl?: string;
  changes?: Array<{ file: string; description: string; timestamp: string }>;
};

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
  "Hi! I'm your content editing assistant. Tell me what you'd like to change on the site.";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch session on mount (user may have a session from a previous page visit)
  useEffect(() => {
    fetch("/api/studio/session")
      .then((r) => r.json())
      .then((data: SessionData) => {
        if (data.status !== "none") setSession(data);
      })
      .catch(() => {});
  }, []);

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

    await sendMessage(apiHistory, {
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

      onToolResult(name, summary) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            // Update the last loading tool call with this name
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
          setSession(newSession as SessionData);
        }
        setIsLoading(false);
      },

      onError(error) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: m.content || `Something went wrong: ${error}`,
                  isStreaming: false,
                }
              : m,
          ),
        );
        setIsLoading(false);
      },
    });
  }

  function handleApproved() {
    setSession(null);
    setMessages((prev) => [
      ...prev,
      systemMessage(
        "Changes published! The site will update in about 1 minute. Feel free to continue editing or start a new conversation.",
      ),
    ]);
  }

  function handleDiscarded() {
    setSession(null);
    setMessages((prev) => [
      ...prev,
      systemMessage("Changes discarded. Ready for a new conversation."),
    ]);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
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
        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs text-center">
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
              />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
