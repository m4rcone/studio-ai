import { runAgent } from "@/lib/studio/agent";
import { getSession, restoreSession } from "@/lib/studio/session";
import { getUser, unauthorized } from "../_helpers";
import type { EditSession } from "@/lib/studio/types";

// Allow up to 2 minutes — the agent may need several Anthropic round-trips
// plus GitHub API calls (file reads, commits, PR creation). 60s is too tight
// for multi-tool workflows (read → update → final response).
export const maxDuration = 120;

export async function POST(request: Request): Promise<Response> {
  const user = await getUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, sessionSnapshot } = body as {
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
    sessionSnapshot?: EditSession | null;
  };

  // If the server lost the in-memory session (serverless cold start between
  // requests), restore it from the client snapshot before running the agent.
  // This prevents ensureSession() from creating a duplicate branch/PR.
  if (sessionSnapshot?.status === "active" && sessionSnapshot.branchName) {
    if (!getSession(user.username)) {
      restoreSession(user.username, sessionSnapshot);
    }
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages array is required" },
      { status: 400 },
    );
  }

  if (messages.length > 50) {
    return Response.json(
      { error: "Message history too long (max 50 messages)" },
      { status: 400 },
    );
  }

  if (JSON.stringify(messages).length > 100_000) {
    return Response.json(
      { error: "Message payload too large (max 100 KB)" },
      { status: 400 },
    );
  }

  const stream = await runAgent({
    messages,
    username: user.username,
    userRole: user.role,
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
