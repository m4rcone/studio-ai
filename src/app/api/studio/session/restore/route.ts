import { restoreSession } from "@/lib/studio/session";
import { getUser, unauthorized } from "../../_helpers";
import type { EditSession } from "@/lib/studio/types";

/**
 * Restores a session from a client-side snapshot after a serverless cold start.
 * Accepts the full EditSession object previously saved in localStorage and
 * re-inserts it into the in-memory session store so the rest of the studio
 * continues to work (approve, discard, chat) without interruption.
 *
 * POST /api/studio/session/restore
 */
export async function POST(request: Request): Promise<Response> {
  const user = await getUser();
  if (!user) return unauthorized();

  let snapshot: EditSession;
  try {
    snapshot = (await request.json()) as EditSession;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!snapshot?.branchName || !snapshot?.status) {
    return Response.json({ error: "Invalid session snapshot" }, { status: 400 });
  }

  const session = restoreSession(user.username, snapshot);
  return Response.json(session);
}
