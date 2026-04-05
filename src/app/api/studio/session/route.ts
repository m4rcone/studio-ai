import { getSession } from "@/lib/studio/session";
import { getUser, unauthorized } from "../_helpers";

export async function GET(): Promise<Response> {
  const user = await getUser();
  if (!user) return unauthorized();

  const activeSession = getSession(user.username);
  if (!activeSession) {
    return Response.json({ status: "none" });
  }

  return Response.json({
    status: activeSession.status,
    branchName: activeSession.branchName,
    prNumber: activeSession.prNumber,
    prUrl: activeSession.prUrl,
    previewUrl: activeSession.previewUrl,
    previewStatus: activeSession.previewStatus,
    changes: activeSession.changes,
    createdAt: activeSession.createdAt,
  });
}
