import { discardSession } from "@/lib/studio/session";
import { getUser, unauthorized } from "../../_helpers";

export async function POST(): Promise<Response> {
  const user = await getUser();
  if (!user) return unauthorized();

  try {
    await discardSession(user.username);
    return Response.json({ success: true, message: "Changes discarded" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to discard changes";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
