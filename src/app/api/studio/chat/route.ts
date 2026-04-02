import { runAgent } from "@/lib/studio/agent";
import { getUser, unauthorized } from "../_helpers";

export async function POST(request: Request): Promise<Response> {
  const user = await getUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages } = body as {
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages array is required" },
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
