import type { EditSession, StreamEvent } from "./types";

export interface ChatMessageData {
  role: "user" | "assistant";
  content: string;
}

interface Callbacks {
  onTextChunk: (text: string) => void;
  onToolCall: (name: string, input: Record<string, unknown>) => void;
  onToolResult: (name: string, summary: string) => void;
  onSessionUpdate: (session: EditSession) => void;
  onDone: (session: EditSession | null) => void;
  onError: (message: string) => void;
}

/**
 * POSTs to /api/studio/chat and processes the newline-delimited JSON stream.
 * Calls the appropriate callback for each event type.
 */
export async function sendMessage(
  messages: ChatMessageData[],
  callbacks: Callbacks,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/studio/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
  } catch (err) {
    callbacks.onError(
      err instanceof Error
        ? err.message
        : "Connection error. Please try again.",
    );
    return;
  }

  if (!res.ok) {
    callbacks.onError(`Server error (${res.status}). Please try again.`);
    return;
  }

  if (!res.body) {
    callbacks.onError("No response body received.");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedDone = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!; // last element may be incomplete

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let event: StreamEvent;
        try {
          event = JSON.parse(trimmed) as StreamEvent;
        } catch {
          continue;
        }

        switch (event.type) {
          case "text":
            callbacks.onTextChunk(event.content);
            break;
          case "tool_call":
            callbacks.onToolCall(event.name, event.input);
            break;
          case "tool_result":
            callbacks.onToolResult(event.name, event.summary);
            break;
          case "session_update":
            callbacks.onSessionUpdate(event.session);
            break;
          case "done":
            receivedDone = true;
            callbacks.onDone(event.session);
            break;
          case "error":
            receivedDone = true; // treat as terminal event
            callbacks.onError(event.message);
            break;
        }
      }
    }

    // Stream closed without a done/error event — likely a server timeout or
    // infrastructure interruption. Treat as an error so the UI unlocks.
    if (!receivedDone) {
      callbacks.onError(
        "The response was interrupted. Please try sending your message again.",
      );
    }
  } catch (err) {
    callbacks.onError(
      err instanceof Error
        ? err.message
        : "Connection lost. Please try again.",
    );
  } finally {
    reader.releaseLock();
  }
}
