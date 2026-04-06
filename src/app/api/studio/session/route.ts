import { getSession, withBypass } from "@/lib/studio/session";
import { getUser, unauthorized } from "../_helpers";

export async function GET(): Promise<Response> {
  const user = await getUser();
  if (!user) return unauthorized();

  const activeSession = getSession(user.username);
  if (!activeSession) {
    return Response.json({ status: "none" });
  }

  // Retroactively apply the bypass token to any previewUrl that was stored
  // before the bypass logic was added (e.g. old localStorage snapshots).
  const previewUrl = activeSession.previewUrl
    ? withBypass(activeSession.previewUrl)
    : null;

  // Keep the in-memory session in sync so restore also returns the right URL.
  if (previewUrl) activeSession.previewUrl = previewUrl;

  return Response.json({
    status: activeSession.status,
    branchName: activeSession.branchName,
    prNumber: activeSession.prNumber,
    prUrl: activeSession.prUrl,
    previewUrl,
    previewStatus: activeSession.previewStatus,
    changes: activeSession.changes,
    createdAt: activeSession.createdAt,
  });
}
