import {
  discardSession,
  getSession,
  restoreSession,
} from "@/lib/studio/session";
import { getUser, unauthorized } from "../../_helpers";
import type { EditSession } from "@/lib/studio/types";

export async function POST(request: Request): Promise<Response> {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    const body = (await request.json().catch(() => ({}))) as {
      sessionSnapshot?: EditSession | null;
    };
    if (
      body.sessionSnapshot?.status === "active" &&
      !getSession(user.username)
    ) {
      restoreSession(user.username, body.sessionSnapshot);
    }
  } catch {
    // ignore parse errors — proceed without snapshot
  }

  try {
    await discardSession(user.username);
    return Response.json({ success: true, message: "Changes discarded" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to discard changes";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
